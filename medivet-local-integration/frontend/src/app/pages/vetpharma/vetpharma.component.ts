import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../services/search.service';

export interface PharmaItem {
  id: number;
  nom: string;
  categorie: 'Médicaments' | 'Antiparasitaires' | 'Compléments & Soins' | 'Hygiène';
  laboratoire: string;
  prix: number;
  ordonnanceRequise: boolean;
  enStock: boolean;
  description: string;
  dosage: string;
  icon: string;
}

@Component({
  selector: 'app-vetpharma',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="vetpharma-page">
      <!-- Hero Banner -->
      <header class="vetpharma-hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            <span>VetPharma — Pharmacie & Ordonnances Vétérinaires</span>
          </div>
          <h1>Prenez soin de vos animaux avec <span class="highlight">VetPharma</span></h1>
          <p>
            Commandez vos médicaments prescrits par votre vétérinaire, antiparasitaires et compléments alimentaires en toute sécurité.
          </p>
          <div class="hero-actions">
            <button type="button" class="btn-primary" (click)="openOrdonnanceModal()">
              <span>📋 Transmettre une ordonnance</span>
            </button>
            <a routerLink="/pets" class="btn-secondary">
              <span>🐾 Voir mon carnet PetPass</span>
            </a>
          </div>
        </div>
      </header>

      <!-- Alert -->
      @if (alertMessage()) {
        <div class="pharma-alert" [class.success]="alertType() === 'success'" [class.error]="alertType() === 'error'">
          <span>{{ alertMessage() }}</span>
          <button (click)="alertMessage.set(null)" class="alert-close">×</button>
        </div>
      }

      <!-- Filters Row -->
      <section class="filters-bar">
        <div class="chips-group">
          @for (cat of categories; track cat) {
            <button 
              type="button"
              class="chip-btn" 
              [class.active]="selectedCategory() === cat"
              (click)="selectedCategory.set(cat)"
            >
              {{ cat }}
            </button>
          }
        </div>
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Rechercher un produit, laboratoire..."
            class="search-input"
          />
        </div>
      </section>

      <!-- Products Grid -->
      <section class="products-grid">
        @for (item of filteredItems(); track item.id) {
          <div class="product-card">
            <div class="card-badge-row">
              @if (item.ordonnanceRequise) {
                <span class="badge-rx">Ordonnance obligatoire</span>
              } @else {
                <span class="badge-free">Accès libre</span>
              }
              <span class="stock-status" [class.in-stock]="item.enStock">
                {{ item.enStock ? 'En stock' : 'Rupture' }}
              </span>
            </div>

            <div class="card-icon-area">
              <span class="product-emoji">{{ item.icon }}</span>
            </div>

            <div class="card-body">
              <span class="card-cat">{{ item.categorie }} • {{ item.laboratoire }}</span>
              <h3 class="product-title">{{ item.nom }}</h3>
              <p class="product-dosage">{{ item.dosage }}</p>
              <p class="product-desc">{{ item.description }}</p>
            </div>

            <div class="card-footer">
              <div class="price-wrap">
                <span class="price-value">{{ item.prix.toFixed(2) }} €</span>
              </div>
              <button 
                type="button" 
                class="btn-order" 
                [disabled]="!item.enStock"
                (click)="commander(item)"
              >
                {{ item.ordonnanceRequise ? 'Commander (avec ordonnance)' : 'Ajouter au panier' }}
              </button>
            </div>
          </div>
        }
      </section>

      <!-- Modal Transmission Ordonnance -->
      @if (showOrdonnanceModal()) {
        <div class="modal-overlay" (click)="closeOrdonnanceModal()">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Transmettre une ordonnance vétérinaire</h2>
              <button class="modal-close-btn" (click)="closeOrdonnanceModal()">×</button>
            </div>
            <div class="modal-body">
              <p class="modal-intro">
                Téléversez l'ordonnance délivrée par votre vétérinaire pour préparer votre commande en pharmacie partenaire.
              </p>
              <div class="form-group">
                <label>Nom de l'animal</label>
                <input type="text" [(ngModel)]="ordoAnimalNom" placeholder="Ex: Max, Milo..." class="input-text" />
              </div>
              <div class="form-group">
                <label>Nom du vétérinaire prescripteur</label>
                <input type="text" [(ngModel)]="ordoVetoNom" placeholder="Ex: Dr. Martin..." class="input-text" />
              </div>
              <div class="form-group">
                <label>Fichier de l'ordonnance (PDF, JPG, PNG)</label>
                <input type="file" (change)="onFileSelected($event)" class="input-file" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="closeOrdonnanceModal()">Annuler</button>
              <button type="button" class="btn-submit" (click)="submitOrdonnance()">Envoyer pour validation</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .vetpharma-page {
      padding: 24px 32px 60px;
      max-width: 1300px;
      margin: 0 auto;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    }

    .vetpharma-hero {
      background: linear-gradient(135deg, #e8f8f0 0%, #d1f2e2 100%);
      border-radius: 24px;
      padding: 38px 44px;
      margin-bottom: 28px;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.08);

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.9);
        color: #065f46;
        font-weight: 700;
        font-size: 0.84rem;
        padding: 6px 14px;
        border-radius: 9999px;
        margin-bottom: 14px;

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
        }
      }

      h1 {
        font-size: 2.2rem;
        font-weight: 800;
        color: #0b3b2c;
        margin: 0 0 12px;
        line-height: 1.2;

        .highlight {
          color: #059669;
        }
      }

      p {
        color: #334155;
        font-size: 1.05rem;
        max-width: 700px;
        margin: 0 0 22px;
        line-height: 1.5;
      }

      .hero-actions {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;

        .btn-primary {
          background: #059669;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s ease;

          &:hover {
            background: #047857;
          }
        }

        .btn-secondary {
          background: #ffffff;
          color: #065f46;
          border: 1px solid #a7f3d0;
          padding: 12px 22px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: background 0.2s ease;

          &:hover {
            background: #f0fdf4;
          }
        }
      }
    }

    .pharma-alert {
      padding: 14px 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;

      &.success {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }

      &.error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      .alert-close {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: inherit;
      }
    }

    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
      flex-wrap: wrap;

      .chips-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .chip-btn {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 8px 18px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
          }

          &.active {
            background: #059669;
            color: white;
            border-color: #059669;
          }
        }
      }

      .search-box {
        .search-input {
          padding: 10px 18px;
          border-radius: 9999px;
          border: 1px solid #cbd5e1;
          width: 280px;
          font-size: 0.92rem;
          outline: none;

          &:focus {
            border-color: #059669;
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
          }
        }
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 22px;
    }

    .product-card {
      background: #ffffff;
      border: 1px solid #edf2f7;
      border-radius: 18px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      }

      .card-badge-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .badge-rx {
          background: #fef3c7;
          color: #92400e;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
        }

        .badge-free {
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
        }

        .stock-status {
          font-size: 0.78rem;
          font-weight: 600;
          color: #ef4444;

          &.in-stock {
            color: #10b981;
          }
        }
      }

      .card-icon-area {
        height: 80px;
        background: #f8fafc;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;

        .product-emoji {
          font-size: 2.4rem;
        }
      }

      .card-body {
        flex: 1;

        .card-cat {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }

        .product-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 4px 0 2px;
        }

        .product-dosage {
          font-size: 0.85rem;
          font-weight: 600;
          color: #059669;
          margin: 0 0 6px;
        }

        .product-desc {
          font-size: 0.86rem;
          color: #64748b;
          line-height: 1.4;
          margin: 0 0 16px;
        }
      }

      .card-footer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-top: 1px solid #f1f5f9;
        padding-top: 14px;

        .price-wrap {
          .price-value {
            font-size: 1.3rem;
            font-weight: 800;
            color: #0b3b2c;
          }
        }

        .btn-order {
          background: #059669;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s ease;

          &:hover:not(:disabled) {
            background: #047857;
          }

          &:disabled {
            background: #cbd5e1;
            cursor: not-allowed;
          }
        }
      }
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-box {
      background: #ffffff;
      width: 100%;
      max-width: 520px;
      border-radius: 20px;
      padding: 24px 28px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;

        h2 {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0b3b2c;
          margin: 0;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          color: #94a3b8;
        }
      }

      .modal-body {
        display: flex;
        flex-direction: column;
        gap: 14px;

        .modal-intro {
          font-size: 0.9rem;
          color: #475569;
          margin: 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;

          label {
            font-size: 0.85rem;
            font-weight: 700;
            color: #334155;
          }

          .input-text {
            padding: 9px 14px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            font-size: 0.92rem;
            outline: none;

            &:focus {
              border-color: #059669;
            }
          }

          .input-file {
            font-size: 0.9rem;
            padding: 6px 0;
          }
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 20px;

        .btn-cancel {
          background: #f1f5f9;
          border: none;
          color: #475569;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-submit {
          background: #059669;
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;

          &:hover {
            background: #047857;
          }
        }
      }
    }
  `]
})
export class VetPharmaComponent {
  readonly searchService = inject(SearchService);
  categories = ['Tous', 'Médicaments', 'Antiparasitaires', 'Compléments & Soins', 'Hygiène'];
  selectedCategory = signal<string>('Tous');
  searchQuery = '';
  alertMessage = signal<string | null>(null);
  alertType = signal<'success' | 'error'>('success');

  showOrdonnanceModal = signal(false);
  ordoAnimalNom = '';
  ordoVetoNom = '';

  items: PharmaItem[] = [
    {
      id: 1,
      nom: 'Nexgard Spectra',
      categorie: 'Antiparasitaires',
      laboratoire: 'Boehringer Ingelheim',
      prix: 38.50,
      ordonnanceRequise: true,
      enStock: true,
      description: 'Traitement mensuel des puces, tiques et vers digestifs pour chiens.',
      dosage: 'Pour chiens de 7.5 à 15 kg (Boîte de 3 cp)',
      icon: '💊'
    },
    {
      id: 2,
      nom: 'Milbemax Tab',
      categorie: 'Antiparasitaires',
      laboratoire: 'Elanco',
      prix: 14.90,
      ordonnanceRequise: true,
      enStock: true,
      description: 'Vermifuge complet à large spectre contre les nématodes et cestodes.',
      dosage: 'Pour chats adultes > 2 kg (Boîte de 2 cp)',
      icon: '🐱'
    },
    {
      id: 3,
      nom: 'Frontline Tri-Act',
      categorie: 'Antiparasitaires',
      laboratoire: 'Boehringer Ingelheim',
      prix: 29.90,
      ordonnanceRequise: false,
      enStock: true,
      description: 'Pipettes spot-on 3-en-1 : repousse, élimine puces, tiques et moustiques.',
      dosage: 'Chiens moyens 10-20 kg (3 pipettes)',
      icon: '💧'
    },
    {
      id: 4,
      nom: 'Silycure Hépatoprotecteur',
      categorie: 'Compléments & Soins',
      laboratoire: 'Dechra',
      prix: 26.00,
      ordonnanceRequise: false,
      enStock: true,
      description: 'Aide au soutien des fonctions hépatiques chez le chien et le chat.',
      dosage: '160 mg (Boîte de 32 comprimés)',
      icon: '🌿'
    },
    {
      id: 5,
      nom: 'Dermipred Anti-inflammatoire',
      categorie: 'Médicaments',
      laboratoire: 'Ceva Santé Animale',
      prix: 18.20,
      ordonnanceRequise: true,
      enStock: true,
      description: 'Traitement symptomatique des dermatites et affections inflammatoires.',
      dosage: '10 mg (Boîte de 20 comprimés sécables)',
      icon: '🩺'
    },
    {
      id: 6,
      nom: 'Douxo S3 Seb Shampooing',
      categorie: 'Hygiène',
      laboratoire: 'Ceva',
      prix: 17.50,
      ordonnanceRequise: false,
      enStock: true,
      description: 'Shampooing physiologique séborégulateur et hydratant hypoallergénique.',
      dosage: 'Flacon pompe 200 ml',
      icon: '🧴'
    }
  ];

  filteredItems(): PharmaItem[] {
    const q = (this.searchService.query() || this.searchQuery).trim().toLowerCase();
    return this.items.filter(item => {
      const matchCat = this.selectedCategory() === 'Tous' || item.categorie === this.selectedCategory();
      const matchQuery = !q || 
        item.nom.toLowerCase().includes(q) ||
        item.laboratoire.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }

  commander(item: PharmaItem): void {
    if (item.ordonnanceRequise) {
      this.openOrdonnanceModal();
      this.alertMessage.set(`Une ordonnance vétérinaire valide est nécessaire pour commander "${item.nom}".`);
      this.alertType.set('error');
    } else {
      this.alertMessage.set(`"${item.nom}" a été ajouté à votre commande.`);
      this.alertType.set('success');
    }
  }

  openOrdonnanceModal(): void {
    this.showOrdonnanceModal.set(true);
  }

  closeOrdonnanceModal(): void {
    this.showOrdonnanceModal.set(false);
  }

  onFileSelected(event: any): void {
    // Ordonnance document
  }

  submitOrdonnance(): void {
    this.closeOrdonnanceModal();
    this.alertMessage.set('Votre ordonnance a été transmise à votre pharmacie partenaire ! Validation en cours.');
    this.alertType.set('success');
  }
}
