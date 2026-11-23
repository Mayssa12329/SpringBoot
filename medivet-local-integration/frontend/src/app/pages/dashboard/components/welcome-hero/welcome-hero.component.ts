import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-banner">
      <!-- Background organic waves & floating paw prints -->
      <div class="wave-bg"></div>
      
      <!-- Paw decorations -->
      <div class="floating-paw paw-1">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 10.5C10.5 10.5 9 12 9 14.5C9 17 10.5 19 12 19C13.5 19 15 17 15 14.5C15 12 13.5 10.5 12 10.5Z"/>
          <circle cx="7.5" cy="9.5" r="2"/><circle cx="16.5" cy="9.5" r="2"/>
          <circle cx="4.5" cy="14" r="1.6"/><circle cx="19.5" cy="14" r="1.6"/>
        </svg>
      </div>
      <div class="floating-paw paw-2">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 10.5C10.5 10.5 9 12 9 14.5C9 17 10.5 19 12 19C13.5 19 15 17 15 14.5C15 12 13.5 10.5 12 10.5Z"/>
          <circle cx="7.5" cy="9.5" r="2"/><circle cx="16.5" cy="9.5" r="2"/>
          <circle cx="4.5" cy="14" r="1.6"/><circle cx="19.5" cy="14" r="1.6"/>
        </svg>
      </div>

      <!-- Left Hero Text -->
      <div class="hero-content">
        <h1 class="welcome-title">
          Welcome Dr. Sarah <span class="wave-hand">👋</span>
        </h1>
        <p class="welcome-subtitle">Take care of our furry friends</p>

        <div class="quick-tags">
          <span class="tag-item">🩺 Service PetPass Actif</span>
          <span class="tag-item">✨ Carnets & Vaccins à jour</span>
        </div>
      </div>

      <!-- Right Hero Photo: Dr. Sarah smiling with the Golden Retriever -->
      <div class="hero-image-wrapper">
        <img 
          src="assets/images/dr-sarah-golden-retriever.png" 
          alt="Dr. Sarah with Golden Retriever" 
          class="hero-art-img"
          (error)="fallbackHeroImage($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .welcome-banner {
      position: relative;
      background: linear-gradient(135deg, #e8f8f0 0%, #cbf2de 50%, #dff7eb 100%);
      border-radius: 24px;
      padding: 28px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.08);
      min-height: 180px;
    }

    .wave-bg {
      position: absolute;
      top: -20%;
      right: -10%;
      width: 50%;
      height: 140%;
      background: radial-gradient(circle, rgba(167, 243, 208, 0.5) 0%, rgba(209, 250, 229, 0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .floating-paw {
      position: absolute;
      color: rgba(16, 185, 129, 0.18);
      pointer-events: none;

      &.paw-1 {
        top: 20px;
        left: 45%;
        width: 32px;
        height: 32px;
        transform: rotate(15deg);
      }

      &.paw-2 {
        bottom: 25px;
        left: 40%;
        width: 24px;
        height: 24px;
        transform: rotate(-25deg);
      }
    }

    .hero-content {
      z-index: 2;
      max-width: 55%;
    }

    .welcome-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0d3829;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      letter-spacing: -0.02em;

      .wave-hand {
        display: inline-block;
        animation: wave 2s infinite;
        transform-origin: 70% 70%;
      }
    }

    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      20%, 60% { transform: rotate(14deg); }
      40%, 80% { transform: rotate(-14deg); }
    }

    .welcome-subtitle {
      font-size: 1.05rem;
      color: #2e6853;
      margin: 8px 0 16px 0;
      font-weight: 500;
    }

    .quick-tags {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;

      .tag-item {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(8px);
        padding: 5px 12px;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        color: #065f46;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }
    }

    .hero-image-wrapper {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;

      .hero-art-img {
        max-height: 160px;
        border-radius: 16px;
        object-fit: cover;
        filter: drop-shadow(0 12px 20px rgba(16, 185, 129, 0.2));
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.03);
        }
      }
    }
  `]
})
export class WelcomeHeroComponent {
  fallbackHeroImage(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/petpass-dashboard-full.png';
  }
}

