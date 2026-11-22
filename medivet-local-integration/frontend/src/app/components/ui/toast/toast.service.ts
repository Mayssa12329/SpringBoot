import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success'): void {
    const id = Date.now();
    this.toasts.update(list => [...list, { id, message, type }]);

    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  remove(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}

