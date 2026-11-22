import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../components/ui/toast/toast.service';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';

export interface Vet {
  id: number;
  name: string;
  specialty: string;
  location: string;
  experience: string;
  rating: number;
  reviews: number;
  availability: 'today' | 'tomorrow' | 'in2days';
  availabilityLabel: string;
  photo: string;
  verified: boolean;
  category: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss'
})
export class BookingComponent {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);
  readonly searchService = inject(SearchService);

  // Search & Filter
  searchQuery = signal('');
  activeFilter = signal('all');

  filters = [
    { id: 'all', label: 'All', icon: '🐾' },
    { id: 'general', label: 'General', icon: '🏥' },
    { id: 'dermatology', label: 'Dermatology', icon: '🔬' },
    { id: 'surgery', label: 'Surgery', icon: '⚕️' },
    { id: 'cardiology', label: 'Cardiology', icon: '❤️' },
  ];

  // Vets list
  vets: Vet[] = [
    {
      id: 1,
      name: 'Dr. Sarah Ben Ali',
      specialty: 'General Veterinarian',
      location: 'Tunis',
      experience: '5+ years exp.',
      rating: 4.9,
      reviews: 248,
      availability: 'today',
      availabilityLabel: 'Available Today',
      photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
      verified: true,
      category: 'general'
    },
    {
      id: 2,
      name: 'Dr. Ahmed Trabelsi',
      specialty: 'Veterinary Surgeon',
      location: 'Sfax',
      experience: '8+ years exp.',
      rating: 4.8,
      reviews: 192,
      availability: 'today',
      availabilityLabel: 'Available Today',
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face',
      verified: true,
      category: 'surgery'
    },
    {
      id: 3,
      name: 'Dr. Leila Mansouri',
      specialty: 'Dermatologist',
      location: 'Gabès',
      experience: '6+ years exp.',
      rating: 4.9,
      reviews: 176,
      availability: 'tomorrow',
      availabilityLabel: 'Available Tomorrow',
      photo: 'https://images.unsplash.com/photo-1594824813626-d62f02604928?w=150&h=150&fit=crop&crop=face',
      verified: true,
      category: 'dermatology'
    },
    {
      id: 4,
      name: 'Dr. Karim Hachani',
      specialty: 'Cardiologist',
      location: 'Sousse',
      experience: '7+ years exp.',
      rating: 4.7,
      reviews: 134,
      availability: 'in2days',
      availabilityLabel: 'Available in 2 days',
      photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&h=150&fit=crop&crop=face',
      verified: true,
      category: 'cardiology'
    }
  ];

  selectedVet = signal<Vet | null>(this.vets[0]);

  filteredVets = computed(() => {
    const f = this.activeFilter();
    const q = (this.searchService.query() || this.searchQuery()).toLowerCase().trim();
    return this.vets.filter(v => {
      const matchCat = f === 'all' || v.category === f;
      const matchQuery = !q || v.name.toLowerCase().includes(q) || v.specialty.toLowerCase().includes(q) || v.location.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  });

  // Calendar
  currentMonth = 'November 2026';
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  calendarDays: (number | null)[] = [
    null, null, null, null, null, 1, 2,
    3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 21, 22, 23,
    24, 25, 26, 27, 28, 29, 30
  ];
  selectedDay = signal(12);

  // Time Slots
  timeSlots: TimeSlot[] = [
    { time: '09:00 AM', available: true, selected: false },
    { time: '09:30 AM', available: true, selected: false },
    { time: '10:00 AM', available: true, selected: true },
    { time: '10:30 AM', available: true, selected: false },
    { time: '11:00 AM', available: true, selected: false },
    { time: '11:30 AM', available: false, selected: false },
    { time: '02:00 PM', available: true, selected: false },
    { time: '02:30 PM', available: true, selected: false },
    { time: '03:00 PM', available: true, selected: false }
  ];
  selectedSlot = signal<string | null>('10:00 AM');

  // Reason
  appointmentReason = 'Consultation générale et contrôle';

  setFilter(id: string): void {
    this.activeFilter.set(id);
  }

  selectVet(vet: Vet): void {
    this.selectedVet.set(vet);
  }

  selectDay(day: number | null): void {
    if (day !== null) {
      this.selectedDay.set(day);
    }
  }

  selectSlot(slot: TimeSlot): void {
    if (!slot.available) return;
    this.timeSlots.forEach(s => s.selected = false);
    slot.selected = true;
    this.selectedSlot.set(slot.time);
  }

  bookAppointment(): void {
    const vet = this.selectedVet();
    const slot = this.selectedSlot();
    const day = this.selectedDay();

    if (!vet || !slot) {
      this.toast.show('Veuillez sélectionner un vétérinaire et un créneau horaire.', 'error');
      return;
    }

    const message = `Rendez-vous confirmé avec ${vet.name} le ${day} ${this.currentMonth} à ${slot} !`;
    this.toast.show(message, 'success');
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
