import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metric-card">
      <div class="metric-icon-box" [style.background-color]="bgColor()" [style.color]="iconColor()">
        <!-- Paw Icon -->
        @if (icon() === 'paw') {
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 10.5C10.5 10.5 9 12 9 14.5C9 17 10.5 19 12 19C13.5 19 15 17 15 14.5C15 12 13.5 10.5 12 10.5Z"/>
            <circle cx="7.5" cy="9.5" r="2"/>
            <circle cx="16.5" cy="9.5" r="2"/>
            <circle cx="4.5" cy="14" r="1.6"/>
            <circle cx="19.5" cy="14" r="1.6"/>
          </svg>
        }
        <!-- Calendar Icon -->
        @else if (icon() === 'calendar') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        }
        <!-- File / Records Icon -->
        @else if (icon() === 'file-text') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        }
        <!-- Star Icon -->
        @else if (icon() === 'star') {
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        }
      </div>

      <div class="metric-details">
        <div class="metric-top">
          <span class="metric-value">{{ value() }}</span>
        </div>
        <div class="metric-label-row">
          <span class="metric-title">{{ title() }}</span>
          @if (trendText()) {
            <span class="metric-trend" [class.positive]="trendPositive()">
              <svg class="trend-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              {{ trendText() }}
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metric-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
      flex: 1;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.08);
      }
    }

    .metric-icon-box {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 24px;
        height: 24px;
      }
    }

    .metric-details {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }

    .metric-label-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .metric-title {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }

    .metric-trend {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #10b981;

      .trend-arrow {
        width: 12px;
        height: 12px;
      }

      &.positive {
        color: #10b981;
      }
    }
  `]
})
export class MetricCardComponent {
  title = input.required<string>();
  value = input.required<string | number>();
  trendText = input<string>();
  trendPositive = input<boolean | undefined>(true);
  icon = input.required<string>();
  bgColor = input<string>('#e8f8f0');
  iconColor = input<string>('#10b981');
}
