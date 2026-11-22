import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Coordinates, ReportCategory, ReportDetail, ReportStatus, ReportSummary } from './models';

const API = '/api/v1/reports';

export interface MapFilters {
  statuses?: ReportStatus[];
  species?: string;
  /** minLat,minLng,maxLat,maxLng */
  bbox?: string | null;
}

export interface NewReport {
  species: string;
  category: ReportCategory;
  description: string;
  severity: number;
  position: Coordinates;
  photo: File;
}

/** Acces a l'API REST des signalements (US19 a US25). */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);

  list(filters: MapFilters = {}): Observable<ReportSummary[]> {
    let params = new HttpParams();
    filters.statuses?.forEach((status) => (params = params.append('status', status)));
    if (filters.species?.trim()) params = params.set('species', filters.species.trim());
    if (filters.bbox) params = params.set('bbox', filters.bbox);
    return this.http.get<ReportSummary[]>(API, { params });
  }

  mine(): Observable<ReportSummary[]> {
    return this.http.get<ReportSummary[]>(`${API}/mine`);
  }

  nearby(
    center: Coordinates,
    radiusKm: number,
    status: ReportStatus | null,
  ): Observable<ReportSummary[]> {
    let params = new HttpParams()
      .set('lat', center.lat)
      .set('lng', center.lng)
      .set('radiusKm', radiusKm);
    if (status) params = params.set('status', status);
    return this.http.get<ReportSummary[]>(`${API}/nearby`, { params });
  }

  get(id: number): Observable<ReportDetail> {
    return this.http.get<ReportDetail>(`${API}/${id}`);
  }

  create(report: NewReport): Observable<ReportDetail> {
    const form = new FormData();
    form.append('species', report.species);
    form.append('category', report.category);
    form.append('description', report.description);
    form.append('severity', String(report.severity));
    form.append('latitude', String(report.position.lat));
    form.append('longitude', String(report.position.lng));
    form.append('photo', report.photo);
    return this.http.post<ReportDetail>(API, form);
  }

  updateLocation(id: number, position: Coordinates): Observable<ReportDetail> {
    return this.http.patch<ReportDetail>(`${API}/${id}/location`, {
      latitude: position.lat,
      longitude: position.lng,
    });
  }

  changeStatus(id: number, status: ReportStatus, comment: string): Observable<ReportDetail> {
    return this.http.patch<ReportDetail>(`${API}/${id}/status`, { status, comment });
  }

  accept(id: number): Observable<ReportDetail> {
    return this.http.post<ReportDetail>(`${API}/${id}/accept`, null);
  }

  hide(id: number, reason: string): Observable<ReportDetail> {
    return this.http.patch<ReportDetail>(`/api/v1/admin/reports/${id}/hide`, { reason });
  }
}

/** Message lisible a partir d'une erreur de l'API (format ApiError). */
export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Une erreur inattendue est survenue.';
  if (error.status === 0) return 'Le serveur HelpAnimal est injoignable.';
  const fields = error.error?.details?.fields as Record<string, string> | undefined;
  if (fields) return Object.values(fields).join(' · ');
  return error.error?.message ?? `Erreur ${error.status}`;
}

/** RM02 : identifiant du signalement existant renvoye avec un 409. */
export function existingReportId(error: unknown): number | null {
  return error instanceof HttpErrorResponse
    ? (error.error?.details?.existingReportId ?? null)
    : null;
}
