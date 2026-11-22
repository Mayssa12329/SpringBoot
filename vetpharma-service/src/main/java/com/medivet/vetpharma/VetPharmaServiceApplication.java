package com.medivet.vetpharma;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Point d'entrée du microservice VetPharma.
 *
 * <p>Ce service expose un serveur gRPC (unaire + streaming serveur) pour :
 * <ul>
 *   <li>Consulter les produits médicamenteux et les pharmacies</li>
 *   <li>Vérifier et suivre les stocks en temps réel</li>
 *   <li>Créer des réservations avec TTL de 15 min et idempotence (RM11)</li>
 * </ul>
 */
@SpringBootApplication
@EnableScheduling   // nécessaire pour la purge automatique des réservations expirées
public class VetPharmaServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(VetPharmaServiceApplication.class, args);
    }
}
