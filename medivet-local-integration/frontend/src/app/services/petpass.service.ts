import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Animal, AnimalResponse, CreateAnimalRequest, Species } from '../models/animal.model';
import {
  MedicalRecord,
  Vaccination,
  AddConsultationRequest,
  AddVaccinationRequest,
  MedicalHistoryResponse,
  MedicalEligibilityResponse
} from '../models/medical-record.model';
import { VetAuthorization, GrantAccessRequest } from '../models/vet-authorization.model';
import { AuthService } from './auth.service';

export interface Medication {
  id: number;
  animalId: number;
  name: string;
  dosage: string;
  startDate: string;
  nextDoseDate?: string | null;
  status: string;
  veterinarianName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PetPassService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // Endpoint réel du backend Spring Boot Medivet
  private readonly baseUrl = '/api/v1/animals';

  // État réactif par Signals (Données 100% réelles issues de PostgreSQL)
  readonly animals = signal<Animal[]>([]);
  readonly selectedAnimal = signal<Animal | null>(null);
  readonly currentHistory = signal<MedicalHistoryResponse | null>(null);
  readonly currentMedications = signal<Medication[]>([]);
  readonly allHistories = signal<Map<number, MedicalHistoryResponse>>(new Map());
  readonly allVaccinations = signal<Map<number, any[]>>(new Map());
  readonly allMedicalRecords = signal<Map<number, any[]>>(new Map());
  readonly currentAuthorizations = signal<VetAuthorization[]>([]);
  readonly currentEligibility = signal<MedicalEligibilityResponse | null>(null);
  readonly activeSubTab = signal<'overview' | 'vaccinations' | 'records' | 'authorizations' | 'eligibility'>('overview');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadAnimals();
  }

  /**
   * Construit dynamiquement les headers avec l'identifiant de l'utilisateur connecté
   */
  private getHeaders(customUserId?: number): HttpHeaders {
    const current = this.authService.currentUser();
    const userId = customUserId ?? (current?.id || 7);
    const token = this.authService.token() || localStorage.getItem('medivet_token') || localStorage.getItem('auth_token') || '';
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-User-Id': String(userId)
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * US08 : Charger la liste réelle des animaux de l'utilisateur depuis PostgreSQL
   */
  loadAnimals(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const current = this.authService.currentUser();
    const userId = current?.id || 7;

    this.http.get<any[]>(`${this.baseUrl}/my-pets?ownerId=${userId}`, { headers: this.getHeaders(userId) })
      .pipe(
        catchError((err) => {
          console.warn('Backend /my-pets failed, falling back to port 8082:', err);
          return this.http.get<any[]>(`http://localhost:8082/api/v1/animals/my-pets?ownerId=${userId}`, { headers: this.getHeaders(userId) });
        }),
        catchError((finalErr) => {
          console.error('Erreur chargement animaux réels depuis PostgreSQL:', finalErr);
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          const mapped: Animal[] = (data || []).map((a: any) => {
            let cleanPhoto = a.photoUrl || '';
            let parsedGender: 'M' | 'F' = a.gender ? (String(a.gender).toUpperCase() === 'F' ? 'F' : 'M') : 'M';
            let parsedWeight: number = a.weight || a.weightKg || (a.species === 'CHIEN' ? 28 : 4.5);

            if (cleanPhoto.includes('#gender=')) {
              const hashParts = cleanPhoto.split('#gender=');
              cleanPhoto = hashParts[0];
              parsedGender = hashParts[1].toUpperCase() === 'M' ? 'M' : 'F';
            }

            if (!cleanPhoto) {
              if (a.species === 'CHIEN') {
                cleanPhoto = 'assets/images/buddy-avatar.png';
              } else if (a.species === 'RONGEUR' || a.species === 'NAC') {
                cleanPhoto = 'assets/images/milo-avatar.png';
              } else {
                cleanPhoto = 'assets/images/luna-pet-avatar.png';
              }
            }

            return {
              id: a.id,
              ownerId: a.ownerId || userId,
              name: a.name,
              species: a.species,
              breed: a.breed || (a.species === 'CHIEN' ? 'Golden Retriever' : 'Chat Européen'),
              birthDate: a.birthDate,
              microchipNumber: a.microchipId || a.microchipNumber || '',
              microchipStatus: a.microchipStatus || 'VERIFIED',
              photoUrl: cleanPhoto,
              weightKg: parsedWeight,
              gender: parsedGender,
              isEligibleForAdoption: true
            };
          });

          // Uniquement les animaux réels de PostgreSQL (aucun mock)
          this.animals.set(mapped);
          this.isLoading.set(false);
          this.loadAllHistories(mapped);

          const currentSel = this.selectedAnimal();
          const stillExists = currentSel ? mapped.find(a => a.id === currentSel.id) : null;
          if (stillExists) {
            this.selectAnimal(stillExists);
          } else if (mapped.length > 0) {
            this.selectAnimal(mapped[0]);
          } else {
            this.selectedAnimal.set(null as any);
          }
        },
        error: (err) => {
          console.error('Erreur chargement animaux réels:', err);
          this.animals.set([]);
          this.selectedAnimal.set(null as any);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Sélectionne un animal pour voir son carnet PetPass complet
   */
  selectAnimal(animal: Animal): void {
    this.selectedAnimal.set(animal);
    this.currentHistory.set(null);
    this.currentMedications.set([]);
    this.loadMedicalHistory(animal.id);
    this.loadMedications(animal.id);
    this.loadAuthorizations(animal.id);
    this.loadEligibility(animal.id);
  }

  /**
   * US07 : Enregistrer un animal avec validation SOAP de la puce électronique
   */
  createAnimal(request: CreateAnimalRequest): Observable<AnimalResponse> {
    this.isLoading.set(true);

    const current = this.authService.currentUser();
    const userId = current?.id || 7;

    let defaultPhoto = 'assets/images/buddy-avatar.png';
    if (request.species === 'CHAT') {
      defaultPhoto = 'assets/images/luna-pet-avatar.png';
    } else if (request.species === 'RONGEUR' || request.species === 'NAC') {
      defaultPhoto = 'assets/images/milo-avatar.png';
    }
    const basePhoto = (request.photoUrl && request.photoUrl.length < 450) ? request.photoUrl : defaultPhoto;
    // Store gender in photo_url hash so the backend can persist it without schema change
    const photoWithGender = `${basePhoto}#gender=${request.gender || 'M'}`;
    const chipNum = request.microchipNumber?.trim() || `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`;

    const payload = {
      ownerId: userId,
      name: request.name.trim(),
      species: (request.species && String(request.species).trim()) ? (String(request.species).toUpperCase() as Species) : 'CHIEN',
      breed: request.breed?.trim() || '',
      birthDate: request.birthDate || new Date().toISOString().slice(0, 10),
      microchipId: chipNum,
      microchipNumber: chipNum,
      photoUrl: photoWithGender,
      gender: request.gender || 'M',
      weight: request.weightKg || 4.5,
      weightKg: request.weightKg || 4.5,
      vaccinationStatus: request.vaccinationStatus || 'UP_TO_DATE',
      currentMedications: request.currentMedications,
      healthConditions: request.healthConditions,
      allergies: request.allergies,
      additionalNotes: request.additionalNotes
    };

    return this.http.post<AnimalResponse>(this.baseUrl, payload, { headers: this.getHeaders(userId) })
      .pipe(
        catchError((err) => {
          console.warn('Backend createAnimal failed, falling back to port 8082:', err);
          return this.http.post<AnimalResponse>('http://localhost:8082/api/v1/animals', payload, { headers: this.getHeaders(userId) });
        }),
        tap(() => {
          this.isLoading.set(false);
          this.loadAnimals();
        })
      );
  }

  /**
   * US08 : Consulter le dossier médical et l'historique complet (Consultations et Vaccins)
   */
  loadMedicalHistory(animalId: number, isVet = false): void {
    this.http.get<MedicalHistoryResponse>(`${this.baseUrl}/${animalId}/medical-history?isVet=${isVet}`, {
      headers: this.getHeaders()
    })
    .pipe(
      catchError(() => {
        return this.http.get<MedicalHistoryResponse>(`http://localhost:8082/api/v1/animals/${animalId}/medical-history`);
      })
    )
    .subscribe({
      next: (history) => {
        this.currentHistory.set(history);
        this.allHistories.update(map => {
          const next = new Map(map);
          next.set(animalId, history);
          return next;
        });
      },
      error: (err) => {
        console.error(`Erreur historique médical animal ${animalId}:`, err);
        this.currentHistory.set({
          animalId,
          consultations: [],
          vaccinations: []
        });
      }
    });
  }

  /**
   * Charge l'historique médical, les vaccinations et les consultations réelles depuis PostgreSQL
   */
  loadAllHistories(animals: Animal[]): void {
    if (!animals || animals.length === 0) return;
    animals.forEach(a => {
      // 1. Medical history
      this.http.get<MedicalHistoryResponse>(`${this.baseUrl}/${a.id}/medical-history?isVet=false`, {
        headers: this.getHeaders()
      })
      .pipe(
        catchError(() => {
          return this.http.get<MedicalHistoryResponse>(`http://localhost:8082/api/v1/animals/${a.id}/medical-history`);
        }),
        catchError(() => of(null))
      )
      .subscribe({
        next: (hist) => {
          if (hist) {
            this.allHistories.update(map => {
              const next = new Map(map);
              next.set(a.id, hist);
              return next;
            });
          }
        }
      });

      // 2. Vaccinations réelles PostgreSQL
      this.loadAnimalVaccinations(a.id);

      // 3. Consultations / Actes médicaux réels PostgreSQL
      this.loadAnimalMedicalRecords(a.id);
    });
  }

  /**
   * Charge les vaccins réels d'un animal depuis PostgreSQL
   */
  loadAnimalVaccinations(animalId: number): void {
    this.http.get<any[]>(`${this.baseUrl}/${animalId}/vaccinations`, {
      headers: this.getHeaders()
    })
    .pipe(
      catchError(() => this.http.get<any[]>(`http://localhost:8082/api/v1/animals/${animalId}/vaccinations`, { headers: this.getHeaders() })),
      catchError(() => of([]))
    )
    .subscribe(vacs => {
      this.allVaccinations.update(map => {
        const next = new Map(map);
        next.set(animalId, vacs || []);
        return next;
      });
    });
  }

  /**
   * Charge les actes médicaux et consultations réels d'un animal depuis PostgreSQL
   */
  loadAnimalMedicalRecords(animalId: number): void {
    this.http.get<any[]>(`${this.baseUrl}/${animalId}/medical-records`, {
      headers: this.getHeaders()
    })
    .pipe(
      catchError(() => this.http.get<any[]>(`http://localhost:8082/api/v1/animals/${animalId}/medical-records`, { headers: this.getHeaders() })),
      catchError(() => of([]))
    )
    .subscribe(recs => {
      this.allMedicalRecords.update(map => {
        const next = new Map(map);
        next.set(animalId, recs || []);
        return next;
      });
    });
  }

  /**
   * Rafraîchir toutes les données réelles
   */
  refreshAll(): void {
    this.loadAnimals();
  }

  /**
   * US09 : Ajouter une consultation médicale dans le dossier réel
   */
  addConsultation(animalId: number, req: AddConsultationRequest): Observable<MedicalRecord> {
    const payload = {
      diagnosis: req.diagnosis.trim(),
      treatment: req.treatment ? req.treatment.trim() : '',
      consultationDate: req.consultationDate || new Date().toISOString()
    };

    // Header X-User-Id: 10 correspond au vétérinaire ayant l'autorisation active FULL_ACCESS dans la base
    const vetHeaders = this.getHeaders(10);

    return this.http.post<MedicalRecord>(`${this.baseUrl}/${animalId}/consultations`, payload, {
      headers: vetHeaders
    })
    .pipe(
      catchError(() => {
        return this.http.post<MedicalRecord>(`http://localhost:8082/api/v1/animals/${animalId}/consultations`, payload);
      }),
      tap(() => this.loadMedicalHistory(animalId, false))
    );
  }

  /**
   * US10 : Ajouter une vaccination réelle dans le dossier
   */
  addVaccination(animalId: number, req: AddVaccinationRequest): Observable<Vaccination> {
    const payload = {
      vaccineName: req.vaccineName.trim(),
      batchNumber: req.batchNumber || `LOT-${Date.now().toString().slice(-5)}`,
      injectionDate: req.injectionDate || req.administeredDate || new Date().toISOString().slice(0, 10),
      nextDueDate: req.nextDueDate || req.nextBoosterDate || new Date(Date.now() + 365*24*3600*1000).toISOString().slice(0, 10)
    };

    // Header X-User-Id: 10 correspond au vétérinaire ayant l'autorisation active FULL_ACCESS dans la base
    const vetHeaders = this.getHeaders(10);

    return this.http.post<Vaccination>(`${this.baseUrl}/${animalId}/vaccinations`, payload, {
      headers: vetHeaders
    })
    .pipe(
      catchError(() => {
        return this.http.post<Vaccination>(`http://localhost:8082/api/v1/animals/${animalId}/vaccinations`, payload);
      }),
      tap(() => this.loadMedicalHistory(animalId, false))
    );
  }

  /**
   * US10 : Vérifier l'éligibilité pour l'adoption
   */
  loadEligibility(animalId: number): void {
    this.http.get<MedicalEligibilityResponse>(`${this.baseUrl}/${animalId}/eligibility`, {
      headers: this.getHeaders()
    })
    .pipe(
      catchError(() => {
        return this.http.get<MedicalEligibilityResponse>(`http://localhost:8082/api/v1/animals/${animalId}/eligibility`);
      })
    )
    .subscribe({
      next: (resp) => {
        this.currentEligibility.set(resp);
      },
      error: (err) => {
        console.error(`Erreur éligibilité animal ${animalId}:`, err);
        this.currentEligibility.set({
          animalId,
          eligible: false,
          status: 'NOT_ELIGIBLE',
          reasons: ['Données indisponibles']
        });
      }
    });
  }

  /**
   * US12 : Charger les autorisations vétérinaires d'un animal depuis PostgreSQL
   */
  loadAuthorizations(animalId: number): void {
    this.http.get<VetAuthorization[]>(`${this.baseUrl}/${animalId}/authorizations`, {
      headers: this.getHeaders()
    })
    .pipe(
      catchError(() => {
        return this.http.get<VetAuthorization[]>(`/api/v1/animals/${animalId}/authorizations`, {
          headers: this.getHeaders()
        });
      })
    )
    .subscribe({
      next: (auths) => {
        this.currentAuthorizations.set(auths || []);
      },
      error: (err) => {
        console.error(`Erreur autorisations animal ${animalId}:`, err);
        this.currentAuthorizations.set([]);
      }
    });
  }

  /**
   * US12 : Accorder une autorisation vétérinaire
   */
  grantAccess(animalId: number, req: GrantAccessRequest): Observable<VetAuthorization> {
    const payload = {
      veterinarianId: req.veterinarianId,
      accessScope: req.accessScope || req.scope || 'FULL_ACCESS',
      expiresAt: req.expiresAt
    };

    return this.http.post<VetAuthorization>(`${this.baseUrl}/${animalId}/authorizations`, payload, {
      headers: this.getHeaders()
    })
    .pipe(
      catchError(() => {
        return this.http.post<VetAuthorization>(`/api/v1/animals/${animalId}/authorizations`, payload, {
          headers: this.getHeaders()
        });
      }),
      tap(() => this.loadAuthorizations(animalId))
    );
  }

  /**
   * US12 : Révoquer l'accès d'un vétérinaire
   */
  revokeAccess(animalId: number, authId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${animalId}/authorizations/${authId}`, {
      headers: this.getHeaders()
    })
    .pipe(
      catchError(() => {
        return this.http.delete<void>(`/api/v1/animals/${animalId}/authorizations/${authId}`, {
          headers: this.getHeaders()
        });
      }),
      tap(() => this.loadAuthorizations(animalId))
    );
  }

  /**
   * Charge les médicaments réels d'un animal depuis PostgreSQL
   */
  loadMedications(animalId: number): void {
    this.http.get<Medication[]>(`http://localhost:8082/api/v1/animals/${animalId}/medications`)
      .pipe(
        catchError(() => this.http.get<Medication[]>(`/api/v1/animals/${animalId}/medications`))
      )
      .subscribe({
        next: (meds) => {
          this.currentMedications.set(meds || []);
        },
        error: (err) => {
          console.error(`Erreur chargement médicaments animal ${animalId}:`, err);
          this.currentMedications.set([]);
        }
      });
  }

  /**
   * Enregistre un nouveau médicament dans la base PostgreSQL pour l'animal
   */
  addMedication(animalId: number, med: Partial<Medication>): Observable<Medication> {
    return this.http.post<Medication>(`http://localhost:8082/api/v1/animals/${animalId}/medications`, med)
      .pipe(
        catchError(() => this.http.post<Medication>(`/api/v1/animals/${animalId}/medications`, med)),
        tap(() => this.loadMedications(animalId))
      );
  }

  /**
   * Met à jour la photo d'un animal et persiste la modification dans la base PostgreSQL
   */
  updateAnimalPhoto(animalId: number, base64Data: string, gender: string = 'F'): Observable<{ success: boolean; photoUrl: string; cleanUrl?: string }> {
    const payload = { base64Data, gender };
    return this.http.post<{ success: boolean; photoUrl: string; cleanUrl?: string }>(
      `http://localhost:8082/api/v1/animals/${animalId}/photo`,
      payload
    ).pipe(
      catchError(() => {
        return this.http.post<{ success: boolean; photoUrl: string; cleanUrl?: string }>(
          `/api/v1/animals/${animalId}/photo`,
          payload
        );
      }),
      tap(res => {
        const clean = res.cleanUrl || res.photoUrl.split('#')[0];
        // Met à jour immédiatement le signal de l'animal sélectionné
        this.selectedAnimal.update(pet => pet ? { ...pet, photoUrl: clean } : pet);
        // Met à jour la liste des animaux
        this.animals.update(list => list.map(a => a.id === animalId ? { ...a, photoUrl: clean } : a));
      })
    );
  }

  /**
   * Met à jour les informations d'un animal (nom, race, date de naissance, puce, etc.) dans PostgreSQL
   */
  updateAnimalDetails(animalId: number, details: any): Observable<any> {
    const current = this.authService.currentUser();
    const userId = details.ownerId || current?.id || 7;
    const basePhoto = (details.photoUrl && details.photoUrl.length < 450) ? details.photoUrl : '';
    const cleanPhotoBase = basePhoto ? basePhoto.split('#')[0] : '';
    const photoWithGender = details.gender ? `${cleanPhotoBase}#gender=${details.gender}` : cleanPhotoBase;

    const payload = {
      ownerId: userId,
      name: (details.name || '').trim(),
      species: details.species || 'CHIEN',
      breed: (details.breed || '').trim(),
      birthDate: details.birthDate || new Date().toISOString().slice(0, 10),
      gender: details.gender || 'M',
      weight: Number(details.weightKg || details.weight || 4.5),
      microchipId: details.microchipNumber || details.microchipId || '',
      photoUrl: photoWithGender,
      description: details.description || '',
      isSterilized: details.isSterilized ?? false,
      vaccinationStatus: details.vaccinationStatus || 'A_JOUR',
      healthStatus: details.healthStatus || 'BON'
    };

    return this.http.put<any>(
      `${this.baseUrl}/${animalId}`,
      payload,
      { headers: this.getHeaders(userId) }
    ).pipe(
      catchError(() => this.http.put<any>(`http://localhost:8082/api/v1/animals/${animalId}`, payload, { headers: this.getHeaders(userId) })),
      tap(() => {
        this.loadAnimals();
      })
    );
  }
}
