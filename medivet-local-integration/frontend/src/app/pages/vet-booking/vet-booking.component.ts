import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VetService } from '../../services/vet.service';
import { Vet, ConsultationType } from '../../models/vet.model';
import { Slot } from '../../models/slot.model';
import { APP_CONFIG } from '../../config/app-config';

interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-vet-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vet-booking.component.html',
  styleUrls: ['./vet-booking.component.scss']
})
export class VetBookingComponent implements OnInit {

  // ── Data ─────────────────────────────────────────────────────────────────
  vets: Vet[] = [];
  filteredVets: Vet[] = [];
  slots: Slot[] = [];
  loading = false;
  loadError = '';
  bookingSuccess = false;
  bookingError = '';
  slotsLoading = false;

  // ── Filters ───────────────────────────────────────────────────────────────
  activeFilter: ConsultationType | 'ALL' = 'ALL';
  selectedCity = '';

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
  selectedDate: Date = new Date();
  selectedSlot: Slot | null = null;

  // ── Calendar ──────────────────────────────────────────────────────────────
  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  get monthLabel(): string {
    return this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  constructor(private vetService: VetService) {}

  ngOnInit(): void {
    this.loadVets();
    this.buildCalendar();
  }

  // ── Load vets ─────────────────────────────────────────────────────────────

  loadVets(): void {
    this.loading = true;
    this.loadError = '';
    const city = this.selectedCity && this.selectedCity !== 'All Cities' ? this.selectedCity : undefined;
    const type = this.activeFilter !== 'ALL' ? this.activeFilter : undefined;

    this.vetService.getVets(city, type).subscribe({
      next: vets => {
        this.vets = vets;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err.status === 0
          ? 'Cannot reach the server. Make sure the backend is running.'
          : `Error ${err.status}: ${err.error?.message || 'Failed to load veterinarians.'}`;
      }
    });
  }

  applyFilter(): void {
    this.filteredVets = this.vets.filter(v => {
      const matchType = this.activeFilter === 'ALL' || v.consultationType === this.activeFilter;
      const matchCity = !this.selectedCity || this.selectedCity === 'All Cities' || v.city === this.selectedCity;
      return matchType && matchCity;
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
  return isoTime.substring(11, 16);
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
    return {
      date,
      day: date.getDate(),
      isToday: this.isSameDay(date, today),
      isSelected: this.isSameDay(date, this.selectedDate),
      isCurrentMonth
    };
  }

selectDay(day: CalendarDay): void {
  if (!day.isCurrentMonth) return;

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
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1, 1
    );
    this.buildCalendar();
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
  }

  // ── Book ──────────────────────────────────────────────────────────────────

  confirmBooking(): void {
    if (!this.selectedVet || !this.selectedSlot) return;

    this.vetService.bookAppointment({
      slotId: this.selectedSlot.id,
      // TODO (US01): replace APP_CONFIG.currentUserId with AuthService.getCurrentUserId()
      ownerId: APP_CONFIG.currentUserId,
      consultationType: this.selectedVet.consultationType
    }).subscribe({
      next: () => {
        this.bookingSuccess = true;
        this.selectedSlot = null;
        setTimeout(() => this.bookingSuccess = false, 4000);
        if (this.selectedVet) this.loadSlots(this.selectedVet.id);
      },
      error: err => {
        this.bookingError = err.error?.message || 'Booking failed. Please try again.';
        setTimeout(() => this.bookingError = '', 4000);
      }
    });
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
}
