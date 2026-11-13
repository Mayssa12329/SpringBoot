package com.medivet.helpanimal.service;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

import javax.imageio.ImageIO;

import com.medivet.helpanimal.config.HelpAnimalProperties;
import com.medivet.helpanimal.exception.InvalidPhotoException;
import com.medivet.helpanimal.exception.PhotoTooLargeException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * US19 : controle de la photo.
 * - obligatoire
 * - JPEG ou PNG
 * - 5 Mo maximum
 * - doit etre une image lisible (pas un fichier renomme)
 */
@Component
public class PhotoValidator {

    private static final Map<String, String> ALLOWED_TYPES = Map.of(
        "image/jpeg", "jpg",
        "image/jpg", "jpg",
        "image/png", "png");

    private final long maxSizeBytes;

    public PhotoValidator(HelpAnimalProperties properties) {
        this.maxSizeBytes = properties.photo().maxSizeBytes();
    }

    /** Verifie la photo et renvoie l'extension a utiliser pour le stockage. */
    public String validate(MultipartFile photo) {
        if (photo == null || photo.isEmpty()) {
            throw new InvalidPhotoException("La photo est obligatoire");
        }
        if (photo.getSize() > maxSizeBytes) {
            throw new PhotoTooLargeException("La photo depasse " + (maxSizeBytes / (1024 * 1024)) + " Mo");
        }
        String contentType = photo.getContentType() == null ? "" : photo.getContentType().toLowerCase();
        String extension = ALLOWED_TYPES.get(contentType);
        if (extension == null) {
            throw new InvalidPhotoException("Format refuse (" + contentType + "). Formats acceptes : JPEG, PNG");
        }
        try (InputStream in = photo.getInputStream()) {
            BufferedImage image = ImageIO.read(in);
            if (image == null || image.getWidth() == 0 || image.getHeight() == 0) {
                throw new InvalidPhotoException("Le fichier n'est pas une image lisible");
            }
        } catch (IOException e) {
            throw new InvalidPhotoException("Le fichier n'est pas une image lisible");
        }
        return extension;
    }
}
