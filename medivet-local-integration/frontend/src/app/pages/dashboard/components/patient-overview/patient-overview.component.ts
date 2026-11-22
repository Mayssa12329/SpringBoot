import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientOverviewStats } from '../../../../models/appointment.model';

@Component({
  selector: 'app-patient-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overview-card">
      <div class="card-header">
        <h3 class="card-title">Patient Overview</h3>
        <span class="period-pill">This Week</span>
      </div>

      <div class="overview-body">
        <!-- SVG Donut Chart with 68% in center -->
        <div class="donut-wrapper">
          <svg class="donut-svg" viewBox="0 0 120 120">
            <!-- Background track -->
            <circle cx="60" cy="60" r="46" fill="none" stroke="#f1f5f9" stroke-width="14" />
            
            <!-- Needs Follow-up (10%) - Orange -->
            <!-- Circumference = 2 * PI * 46 ≈ 289 -->
            <circle cx="60" cy="60" r="46" fill="none" stroke="#f59e0b" stroke-width="14"
                    stroke-dasharray="289" stroke-dashoffset="0"
                    transform="rotate(-90 60 60)" stroke-linecap="round" />

            <!-- Under Treatment (22%) - Cyan/Blue -->
            <circle cx="60" cy="60" r="46" fill="none" stroke="#06b6d4" stroke-width="14"
                    stroke-dasharray="260 289" stroke-dashoffset="29"
                    transform="rotate(-90 60 60)" stroke-linecap="round" />

            <!-- Healthy (68%) - Emerald Green -->
            <circle cx="60" cy="60" r="46" fill="none" stroke="#10b981" stroke-width="14"
                    stroke-dasharray="196 289" stroke-dashoffset="93"
                    transform="rotate(-90 60 60)" stroke-linecap="round" />
          </svg>

          <!-- Center label -->
          <div class="donut-center-text">
            <span class="donut-percent">{{ stats().healthyPercentage }}%</span>
            <span class="donut-sub">Healthy</span>
          </div>
        </div>

        <!-- Legend breakdown -->
        <div class="legend-column">
          <div class="legend-item">
            <span class="legend-dot healthy"></span>
            <span class="legend-label">Healthy</span>
            <span class="legend-val">{{ stats().healthyPercentage }}%</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot treatment"></span>
            <span class="legend-label">Under Treatment</span>
            <span class="legend-val">{{ stats().underTreatmentPercentage }}%</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot follow-up"></span>
            <span class="legend-label">Needs Follow-up</span>
            <span class="legend-val">{{ stats().needsFollowUpPercentage }}%</span>
          </div>
        </div>
      </div>

      <!-- Weekly Trend Sparkline at the bottom -->
      <div class="sparkline-section">
        <div class="sparkline-header">
          <span class="sparkline-title">Weekly Consultation Volume</span>
          <span class="sparkline-stat">+14.2%</span>
        </div>
        <svg class="sparkline-svg" viewBox="0 0 300 45" preserveAspectRatio="none">
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <path d="M 0 35 Q 40 30, 70 20 T 140 28 T 210 12 T 300 5 L 300 45 L 0 45 Z" fill="url(#curveGradient)" />
          <path d="M 0 35 Q 40 30, 70 20 T 140 28 T 210 12 T 300 5" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
          <circle cx="300" cy="5" r="4" fill="#047857" stroke="#ffffff" stroke-width="2" />
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .overview-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .period-pill {
      font-size: 0.725rem;
      font-weight: 700;
      color: #059669;
      background: #e8f8f0;
      padding: 4px 10px;
      border-radius: 9999px;
    }

    .overview-body {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 20px;
      padding: 10px 0;
    }

    .donut-wrapper {
      position: relative;
      width: 140px;
      height: 140px;
      flex-shrink: 0;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
      transform: rotate(0deg);
    }

    .donut-center-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.1;

      .donut-percent {
        font-size: 1.45rem;
        font-weight: 800;
        color: #0f172a;
      }

      .donut-sub {
        font-size: 0.7rem;
        color: #64748b;
        font-weight: 600;
      }
    }

    .legend-column {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.825rem;

      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;

        &.healthy { background: #10b981; }
        &.treatment { background: #06b6d4; }
        &.follow-up { background: #f59e0b; }
      }

      .legend-label {
        color: #475569;
        font-weight: 600;
        flex: 1;
      }

      .legend-val {
        color: #0f172a;
        font-weight: 700;
      }
    }

    .sparkline-section {
      margin-top: 18px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 14px;
    }

    .sparkline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .sparkline-title {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 600;
      }

      .sparkline-stat {
        font-size: 0.75rem;
        color: #10b981;
        font-weight: 800;
      }
    }

    .sparkline-svg {
      width: 100%;
      height: 38px;
    }
  `]
})
export class PatientOverviewComponent {
  stats = input.required<PatientOverviewStats>();
}

