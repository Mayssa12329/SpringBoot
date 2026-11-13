package com.medivet.helpanimal.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import com.medivet.helpanimal.config.HelpAnimalProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Stockage des photos sur disque (dossier "uploads" par defaut).
 * Les photos sont servies sous /photos/{nom} (voir WebConfig).
 * Pour passer a MinIO / S3, il suffit de remplacer cette classe.
 */
@Service
public class StorageService {

    private final Path root;

    public StorageService(HelpAnimalProperties properties) {
        this.root = Paths.get(properties.storage().directory()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de creer le dossier de stockage " + root, e);
        }
    }

    /** Enregistre le fichier et renvoie son URL publique. */
    public String store(MultipartFile file, String extension) {
        String fileName = UUID.randomUUID() + "." + extension;
        Path target = root.resolve(fileName);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Echec de l'enregistrement de la photo", e);
        }
        return "/photos/" + fileName;
    }

    public Path getRoot() {
        return root;
    }
}
