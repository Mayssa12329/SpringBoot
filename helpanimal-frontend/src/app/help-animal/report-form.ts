import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { AuthService } from '../core/auth.service';
import { formatCoordinates, parseCoordinates } from '../core/geo';
import { ReportCategory } from '../core/models';
import { apiErrorMessage, existingReportId, ReportService } from '../core/report.service';
import { Icon, IconName } from '../shared/icon';
import { HelpAnimalStore } from './help-animal.store';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png'];
const MAX_DESCRIPTION = 500;

const MAIN_CATEGORIES: { value: ReportCategory | 'OTHER'; label: string; icon: IconName }[] = [
  { value: 'BLESSE', label: 'Animal blessé', icon: 'cross' },
  { value: 'ABANDONNE', label: 'Animal abandonné', icon: 'house' },
  { value: 'PERDU', label: 'Animal perdu', icon: 'pin' },
  { value: 'OTHER', label: 'Autre', icon: 'dots' },
];

const OTHER_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'MALADE', label: 'Animal malade' },
  { value: 'MALTRAITE', label: 'Animal maltraité' },
  { value: 'AUTRE', label: 'Autre situation' },
];

/** US19 + US20 : formulaire de signalement avec photo et position. */
@Component({
  selector: 'app-report-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './report-form.html',
  styleUrl: './report-form.css',
})
export class ReportForm {
  private readonly store = inject(HelpAnimalStore);
  private readonly reportService = inject(ReportService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly auth = inject(AuthService);

  protected readonly mainCategories = MAIN_CATEGORIES;
  protected readonly otherCategories = OTHER_CATEGORIES;
  protected readonly maxDescription = MAX_DESCRIPTION;
  protected readonly severities = [1, 2, 3, 4, 5];

  protected readonly mainCategory = signal<ReportCategory | 'OTHER'>('BLESSE');
  protected readonly otherCategory = signal<ReportCategory>('MALADE');
  protected readonly species = signal('');
  protected readonly severity = signal(3);
  protected readonly description = signal('');
  protected readonly photo = signal<File | null>(null);
  protected readonly photoPreview = signal<string | null>(null);
  protected readonly dragging = signal(false);
  protected readonly submitted = signal(false);
  protected readonly sending = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly duplicateId = signal<number | null>(null);
  protected readonly photoError = signal<string | null>(null);

  /** Le champ suit la carte ; la saisie manuelle l'emporte jusqu'au prochain clic. */
  protected readonly locationText = linkedSignal(() => {
    const position = this.store.pickedPosition();
    return position ? formatCoordinates(position) : '';
  });

  protected readonly speciesInvalid = computed(() => !this.species().trim());
  protected readonly descriptionInvalid = computed(() => !this.description().trim());
  protected readonly positionInvalid = computed(() => !this.store.pickedPosition());
  protected readonly photoMissing = computed(() => !this.photo());

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  /** Bouton "Signaler un animal" du bandeau. */
  focus(): void {
    const element = this.host.nativeElement;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element.querySelector<HTMLInputElement>('#species')?.focus({ preventScroll: true });
  }

  protected selectPhoto(file: File | undefined): void {
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      this.photoError.set('Format refusé : choisissez une photo JPEG ou PNG.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      this.photoError.set('La photo dépasse 5 Mo.');
      return;
    }
    this.photoError.set(null);
    this.revokePreview();
    this.photo.set(file);
    this.photoPreview.set(URL.createObjectURL(file));
  }

  protected removePhoto(input: HTMLInputElement): void {
    input.value = '';
    this.revokePreview();
    this.photo.set(null);
    this.photoPreview.set(null);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.selectPhoto(event.dataTransfer?.files[0]);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected applyTypedLocation(): void {
    const text = this.locationText().trim();
    if (!text) {
      this.store.pickedPosition.set(null);
      return;
    }
    const position = parseCoordinates(text);
    this.store.pickedPosition.set(position);
    if (position) this.store.focusRequest.set(position);
  }

  protected async useMyLocation(): Promise<void> {
    const position = await this.store.locateUser();
    if (position) this.store.pickedPosition.set(position);
  }

  protected selectOtherCategory(value: string): void {
    this.otherCategory.set(value as ReportCategory);
  }

  protected openDuplicate(id: number): void {
    this.store.selectedReportId.set(id);
  }

  protected submit(fileInput: HTMLInputElement): void {
    this.submitted.set(true);
    this.serverError.set(null);
    this.duplicateId.set(null);

    const photo = this.photo();
    const position = this.store.pickedPosition();
    if (!photo || !position || this.speciesInvalid() || this.descriptionInvalid()) return;

    const main = this.mainCategory();
    this.sending.set(true);
    this.reportService
      .create({
        species: this.species().trim(),
        category: main === 'OTHER' ? this.otherCategory() : main,
        description: this.description().trim(),
        severity: this.severity(),
        position,
        photo,
      })
      .subscribe({
        next: (report) => {
          this.sending.set(false);
          this.reset(fileInput);
          this.store.activeTab.set('map');
          this.store.focusRequest.set(position);
          this.store.showToast({
            kind: 'success',
            text: `Signalement #${report.id} envoyé. Merci !`,
          });
          this.store.refresh();
        },
        error: (error) => {
          this.sending.set(false);
          this.serverError.set(apiErrorMessage(error));
          this.duplicateId.set(existingReportId(error));
        },
      });
  }

  private reset(fileInput: HTMLInputElement): void {
    this.removePhoto(fileInput);
    this.description.set('');
    this.species.set('');
    this.severity.set(3);
    this.store.pickedPosition.set(null);
    this.submitted.set(false);
  }

  private revokePreview(): void {
    const preview = this.photoPreview();
    if (preview) URL.revokeObjectURL(preview);
  }
}
