import { Component, OnInit, afterNextRender, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VetService } from '../../services/vet.service';
import { Vet, ConsultationType } from '../../models/vet.model';
import { Slot } from '../../models/slot.model';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';
import { PetPassService } from '../../services/petpass.service';
import { Animal } from '../../models/animal.model';

interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit {

  // ── Data ─────────────────────────────────────────────────────────────────
  vets: Vet[] = [];
  filteredVets: Vet[] = [];
  slots: Slot[] = [];
  loading = true;
  loadError = '';
  bookingSuccess = false;
  bookingError = '';
  bookingLoading = false;
  slotsLoading = false;

  // ── Filters ───────────────────────────────────────────────────────────────
  activeFilter: ConsultationType | 'ALL' = 'ALL';
  selectedCity = 'All Cities';

  /**
   * All 8 consultation types matching the backend ConsultationType enum (US13).
   * Values are sent as-is to GET /api/v1/vets?consultationType=<VALUE>.
   */
  filters: { label: string; value: ConsultationType | 'ALL'; icon: string }[] = [
    { label: 'All',          value: 'ALL',          icon: '⊞'  },
    { label: 'General',      value: 'GENERAL',      icon: '🩺' },
    { label: 'Surgery',      value: 'SURGERY',      icon: '🔪' },
    { label: 'Dermatology',  value: 'DERMATOLOGY',  icon: '🔬' },
    { label: 'Cardiology',   value: 'CARDIOLOGY',   icon: '❤️' },
    { label: 'Orthopedics',  value: 'ORTHOPEDICS',  icon: '🦴' },
    { label: 'Ophthalmology',value: 'OPHTHALMOLOGY',icon: '👁️' },
    { label: 'Dentistry',    value: 'DENTISTRY',    icon: '🦷' },
    { label: 'Emergency',    value: 'EMERGENCY',    icon: '🚨' },
  ];

  /** Cities matching the seed data in init.sql. */
  cities = ['All Cities', 'Tunis', 'Sfax', 'Sousse', 'Gabès', 'Bizerte'];

  // ── Selection ─────────────────────────────────────────────────────────────
  selectedVet: Vet | null = null;
  selectedDate: Date = new Date(new Date().setHours(0, 0, 0, 0));
  selectedSlot: Slot | null = null;
  selectedPetId: number | null = null;

  get pets(): Animal[] {
    return this.petPassService.animals();
  }

  get petsLoading(): boolean {
    return this.petPassService.isLoading();
  }

  // ── Calendar ──────────────────────────────────────────────────────────────
  currentMonth: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  calendarDays: CalendarDay[] = [];
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  get monthLabel(): string {
    return this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  constructor(
    private vetService: VetService,
    private authService: AuthService,
    private router: Router,
    private searchService: SearchService,
    private petPassService: PetPassService
  ) {
    effect(() => {
      this.searchService.query();
      this.applyFilter();
    });
    afterNextRender(() => this.loadVets());
  }

  ngOnInit(): void {
    this.buildCalendar();
    if (this.pets.length === 0 && !this.petsLoading) {
      this.petPassService.loadAnimals();
    }
  }

  // ── Load vets ─────────────────────────────────────────────────────────────

  loadVets(): void {
    this.loading = true;
    this.loadError = '';
    const city = this.selectedCity !== 'All Cities' ? this.selectedCity : undefined;
    const type = this.activeFilter !== 'ALL' ? this.activeFilter : undefined;

    this.vetService.getVets(city, type).subscribe({
      next: vets => {
        this.vets = vets;
        this.applyFilter();
        this.loading = false;
        if (!this.selectedVet || !vets.some(vet => vet.id === this.selectedVet?.id)) {
          this.selectedVet = this.filteredVets[0] ?? null;
          if (this.selectedVet) this.loadSlots(this.selectedVet.id);
        }
      },
      error: (err) => {
        this.loading = false;
        this.vets = [];
        this.filteredVets = [];
        this.loadError = err.status === 0
          ? 'Cannot reach the server. Make sure the backend is running.'
          : `Error ${err.status}: ${err.error?.message || 'Failed to load veterinarians.'}`;
      }
    });
  }

  applyFilter(): void {
    const query = this.searchService.query().trim().toLowerCase();
    this.filteredVets = this.vets.filter(v => {
      const matchType = this.activeFilter === 'ALL' || v.consultationType === this.activeFilter;
      const matchCity = !this.selectedCity || this.selectedCity === 'All Cities' || v.city === this.selectedCity;
      const searchableText = `${v.firstName} ${v.lastName} ${v.city ?? ''} ${v.clinicName} ${this.getSpecialtyLabel(v.consultationType)}`.toLowerCase();
      const matchSearch = !query || searchableText.includes(query);
      return matchType && matchCity && matchSearch;
    });
  }

 setFilter(value: ConsultationType | 'ALL'): void {
  this.activeFilter = value;
  this.loadVets();
}

setCity(city: string): void {
  this.selectedCity = city;
  this.loadVets();
}

  // ── Vet selection + slot loading ──────────────────────────────────────────

  selectVet(vet: Vet): void {
    this.selectedVet = vet;
    this.selectedSlot = null;
    this.loadSlots(vet.id);
  }
loadSlots(vetId: number): void {
  this.slots = [];
  this.selectedSlot = null;
  this.slotsLoading = true;

  const date = this.formatDateForApi(this.selectedDate);

  this.vetService.getAvailableSlots(vetId, date).subscribe({
    next: slots => {
      this.slots = slots;
      this.slotsLoading = false;
    },
    error: err => {
      console.error('Error loading available slots:', err);
      this.slots = [];
      this.slotsLoading = false;
    }
  });
}
formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
  selectSlot(slot: Slot): void {
    if (slot.status === 'AVAILABLE') {
      this.selectedSlot = slot;
    }
  }

 formatSlotTime(isoTime: string): string {
  const time = isoTime.includes('T') ? isoTime.split('T')[1].slice(0, 5) : isoTime.slice(0, 5);
  const [hourValue, minuteValue] = time.split(':').map(Number);
  if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) return isoTime;
  const hour = hourValue % 12 || 12;
  const period = hourValue >= 12 ? 'PM' : 'AM';
  return `${hour}:${String(minuteValue).padStart(2, '0')} ${period}`;
}
  // ── Calendar ──────────────────────────────────────────────────────────────

  buildCalendar(): void {
    const year  = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const today = new Date();

    const firstDay = new Date(year, month, 1);
    // Monday=0, shift Sunday to position 6
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: CalendarDay[] = [];

    // Padding days from previous month
    for (let i = startOffset; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push(this.makeDay(d, false, today));
    }

    // Current month days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(this.makeDay(new Date(year, month, d), true, today));
    }

    // Padding to complete last row (max 42 cells)
    let next = 1;
    while (days.length < 42) {
      days.push(this.makeDay(new Date(year, month + 1, next++), false, today));
    }

    this.calendarDays = days;
  }

  private makeDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return {
      date,
      day: date.getDate(),
      isToday: this.isSameDay(date, today),
      isSelected: this.isSameDay(date, this.selectedDate),
      isCurrentMonth,
      isPast: dateOnly < todayOnly
    };
  }

selectDay(day: CalendarDay): void {
  if (!day.isCurrentMonth || day.isPast) return;

  this.selectedDate = day.date;
  this.selectedSlot = null;

  this.calendarDays.forEach(d =>
    d.isSelected = this.isSameDay(d.date, day.date)
  );

  if (this.selectedVet) {
    this.loadSlots(this.selectedVet.id);
  }
}

  prevMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1, 1
    );
    this.updateDateForDisplayedMonth();
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1, 1
    );
    this.updateDateForDisplayedMonth();
    this.buildCalendar();
  }

  private updateDateForDisplayedMonth(): void {
    const now = new Date();
    const isCurrentMonth =
      this.currentMonth.getFullYear() === now.getFullYear() &&
      this.currentMonth.getMonth() === now.getMonth();
    this.selectedDate = isCurrentMonth
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const selectedVet = this.selectedVet;
    if (selectedVet) this.loadSlots(selectedVet.id);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
  }

  // ── Book ──────────────────────────────────────────────────────────────────

  confirmBooking(): void {
    if (!this.selectedVet || !this.selectedSlot || this.selectedPetId === null || this.bookingLoading) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.bookingError = 'Please sign in again before confirming your appointment.';
      setTimeout(() => this.bookingError = '', 4000);
      return;
    }

    this.bookingLoading = true;
    this.bookingError = '';
    this.vetService.bookAppointment({
      slotId: this.selectedSlot.id,
      ownerId: user.id,
      petId: this.selectedPetId,
      consultationType: this.selectedVet.consultationType
    }).subscribe({
      next: () => {
        this.bookingSuccess = true;
        this.bookingError = '';
        this.bookingLoading = false;
        this.selectedSlot = null;
        setTimeout(() => this.bookingSuccess = false, 4000);
        if (this.selectedVet) this.loadSlots(this.selectedVet.id);
      },
      error: err => {
        this.bookingLoading = false;
        this.bookingError = err.error?.message || 'Booking failed. Please try again.';
        setTimeout(() => this.bookingError = '', 4000);
      }
    });
  }

  goToConsultations(): void {
    this.router.navigate(['/pets'], { queryParams: { view: 'consultations' } });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getAvailabilityLabel(v: Vet): string {
    if (v.availability === 'today')    return 'Available Today';
    if (v.availability === 'tomorrow') return 'Available Tomorrow';
    return 'Available in 2 days';
  }

  getAvailabilityClass(v: Vet): string {
    if (v.availability === 'today')    return 'avail-today';
    if (v.availability === 'tomorrow') return 'avail-tomorrow';
    return 'avail-later';
  }

  getSpecialtyLabel(type: ConsultationType): string {
    const map: Record<ConsultationType, string> = {
      GENERAL: 'General Veterinarian', SURGERY: 'Veterinary Surgeon',
      DERMATOLOGY: 'Dermatologist',    CARDIOLOGY: 'Cardiologist',
      ORTHOPEDICS: 'Orthopedist',      OPHTHALMOLOGY: 'Ophthalmologist',
      DENTISTRY: 'Dentist',            EMERGENCY: 'Emergency Vet'
    };
    return map[type] ?? type;
  }

  getStars(rating: number = 0): string[] {
    return Array(5).fill('').map((_, i) => i < Math.round(rating) ? '★' : '☆');
  }

  scrollToBooking(): void {
    document.getElementById('booking-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  goToHelp(): void {
    this.router.navigate(['/helpanimal']);
  }
}
