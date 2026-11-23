import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PetPassHomeComponent } from './petpass-home.component';
import { PetPassViewComponent } from './petpass-view.component';
import { PetPassAllPetsComponent } from './petpass-all-pets.component';
import { PetPassVaccinationsComponent } from './petpass-vaccinations.component';
import { PetPassConsultationsComponent } from './petpass-consultations.component';
import { Animal } from '../../models/animal.model';

@Component({
  selector: 'app-pets',
  standalone: true,
  imports: [
    CommonModule, 
    PetPassHomeComponent, 
    PetPassViewComponent, 
    PetPassAllPetsComponent, 
    PetPassVaccinationsComponent,
    PetPassConsultationsComponent
  ],
  template: `
    @if (currentView() === 'home') {
      <app-petpass-home 
        (viewDetails)="showCarnet()" 
        (viewAllPets)="showAllPets()"
        (viewVaccinations)="showVaccinations()"
        (viewConsultations)="showConsultations()"
      ></app-petpass-home>
    } @else if (currentView() === 'all-pets') {
      <app-petpass-all-pets 
        (back)="showHome()" 
        (openCarnet)="showCarnet()"
        (addPet)="showHomeAndAddPet()"
      ></app-petpass-all-pets>
    } @else if (currentView() === 'vaccinations') {
      <app-petpass-vaccinations 
        (back)="showHome()" 
        (openCarnet)="showCarnet()"
      ></app-petpass-vaccinations>
    } @else if (currentView() === 'consultations') {
      <app-petpass-consultations 
        (back)="showHome()" 
        (openCarnet)="showCarnet()"
      ></app-petpass-consultations>
    } @else {
      <app-petpass-view 
        (back)="showHome()"
      ></app-petpass-view>
    }
  `
})
export class PetsComponent implements OnInit {
  private route = inject(ActivatedRoute);

  // Par défaut : la page d'accueil PetPass d'origine
  currentView = signal<'home' | 'all-pets' | 'carnet' | 'vaccinations' | 'consultations'>('home');

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'all-pets' || params['view'] === 'all' || params['view'] === 'animaux') {
        this.currentView.set('all-pets');
      } else if (params['view'] === 'vaccinations' || params['view'] === 'vaccins') {
        this.currentView.set('vaccinations');
      } else if (params['view'] === 'consultations' || params['view'] === 'visits') {
        this.currentView.set('consultations');
      } else if (params['view'] === 'carnet') {
        this.currentView.set('carnet');
      } else if (params['view'] === 'home') {
        this.currentView.set('home');
      }
    });
  }

  showHome(): void {
    this.currentView.set('home');
  }

  showAllPets(): void {
    this.currentView.set('all-pets');
  }

  showCarnet(): void {
    this.currentView.set('carnet');
  }

  showVaccinations(): void {
    this.currentView.set('vaccinations');
  }

  showConsultations(): void {
    this.currentView.set('consultations');
  }

  showHomeAndAddPet(): void {
    this.currentView.set('home');
  }
}
