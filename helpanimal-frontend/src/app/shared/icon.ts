import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/** Silhouette d'un marqueur de carte, en 36 x 46. */
export const PIN_PATH =
  'M18 1C8.6 1 1 8.6 1 18c0 12.5 17 27 17 27s17-14.5 17-27C35 8.6 27.4 1 18 1z';

/** Patte d'animal, en 24 x 24. */
export const PAW_PATHS = [
  'M12 11c-3 0-6 2.7-6 5.5 0 1.7 1.3 2.5 2.8 2.5 1.2 0 2-.6 3.2-.6s2 .6 3.2.6c1.5 0 2.8-.8 2.8-2.5 0-2.8-3-5.5-6-5.5z',
  'M3.5 11a1.8 2.2 0 1 0 3.6 0a1.8 2.2 0 1 0-3.6 0',
  'M7.7 6.5a1.9 2.4 0 1 0 3.8 0a1.9 2.4 0 1 0-3.8 0',
  'M12.5 6.5a1.9 2.4 0 1 0 3.8 0a1.9 2.4 0 1 0-3.8 0',
  'M16.9 11a1.8 2.2 0 1 0 3.6 0a1.8 2.2 0 1 0-3.6 0',
];

/** Pictogrammes au trait, en 24 x 24. */
const ICONS = {
  home: ['M3 11l9-8 9 8', 'M5 10v10h5v-6h4v6h5V10'],
  pass: ['M3 6h18v14H3z', 'M3 10h18', 'M8 3v4', 'M16 3v4', 'M8 15l2 2 4-4'],
  calendar: ['M4 6h16v15H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4', 'M12 13v5', 'M9.5 15.5h5'],
  heart: ['M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z'],
  pill: ['M10 21a6 6 0 0 1-4-10l5-5a6 6 0 0 1 8 8l-5 5a6 6 0 0 1-4 2z', 'M8.5 8.5l7 7'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M12 9v6', 'M9 12h6'],
  bell: ['M6 16V11a6 6 0 0 1 12 0v5l2 2H4z', 'M10 21h4'],
  settings: [
    circle(12, 12, 3),
    'M12 3v3',
    'M12 18v3',
    'M3 12h3',
    'M18 12h3',
    'M5.6 5.6l2.1 2.1',
    'M16.3 16.3l2.1 2.1',
    'M5.6 18.4l2.1-2.1',
    'M16.3 7.7l2.1-2.1',
  ],
  search: [circle(11, 11, 7), 'M16.5 16.5L21 21'],
  megaphone: ['M3 10v4l13 5V5z', 'M16 8a4 4 0 0 1 0 8', 'M7 15.5V20h3v-3.3'],
  arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
  camera: ['M3 8h4l2-3h6l2 3h4v12H3z', circle(12, 13.5, 3.5)],
  pin: ['M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z', circle(12, 9, 2.5)],
  map: ['M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z', 'M9 4v14', 'M15 6v14'],
  send: ['M21 3L3 11l7 3 3 7z', 'M10 14L21 3'],
  clock: [circle(12, 12, 9), 'M12 7v5l3 2'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  cross: ['M9 3h6v6h6v6h-6v6H9v-6H3V9h6z'],
  house: ['M4 11l8-7 8 7', 'M6 9.5V20h12V9.5', 'M10 20v-6h4v6'],
  dots: [circle(5, 12, 1), circle(12, 12, 1), circle(19, 12, 1)],
  user: [circle(12, 8, 4), 'M4 21c1-4 4-6 8-6s7 2 8 6'],
  headset: ['M4 14v-2a8 8 0 0 1 16 0v2', 'M4 14h3v5H4z', 'M17 14h3v5h-3z', 'M20 19c0 2-3 3-6 3'],
  locate: [circle(12, 12, 6), circle(12, 12, 2), 'M12 2v4', 'M12 18v4', 'M2 12h4', 'M18 12h4'],
  check: ['M5 12l5 5 9-10'],
  chevron: ['M6 9l6 6 6-6'],
  paw: PAW_PATHS,
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      aria-hidden="true"
      [attr.fill]="filled() ? 'currentColor' : 'none'"
      [attr.stroke]="filled() ? 'none' : 'currentColor'"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly filled = computed(() => this.name() === 'paw');
  readonly paths = computed<readonly string[]>(() => ICONS[this.name()]);
}
