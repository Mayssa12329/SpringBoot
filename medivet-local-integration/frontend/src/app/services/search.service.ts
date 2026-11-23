import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  /**
   * Signal global contenant la requête de recherche active
   * partagée entre l'en-tête (app-header) et l'ensemble des pages.
   */
  readonly query = signal<string>('');

  /**
   * Met à jour la requête de recherche
   */
  setQuery(val: string): void {
    this.query.set(val || '');
  }

  /**
   * Réinitialise la recherche
   */
  clear(): void {
    this.query.set('');
  }
}
