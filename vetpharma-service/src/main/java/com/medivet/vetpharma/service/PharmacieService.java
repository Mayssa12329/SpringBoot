package com.medivet.vetpharma.service;

import com.medivet.vetpharma.entity.Pharmacie;
import com.medivet.vetpharma.exception.ResourceNotFoundException;
import com.medivet.vetpharma.repository.PharmacieRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class PharmacieService {

    private final PharmacieRepository repo;

    public PharmacieService(PharmacieRepository repo) {
        this.repo = repo;
    }

    public List<Pharmacie> listerToutes() {
        return repo.findAll();
    }

    public List<Pharmacie> listerParVille(String ville) {
        if (ville == null || ville.isBlank()) return listerToutes();
        return repo.findByVilleIgnoreCase(ville);
    }

    public Pharmacie obtenirParId(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacie introuvable : id=" + id));
    }
}
