package tn.medivet.adoptanimal.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record RencontreRequest(@NotNull @Future LocalDateTime dateRencontre) {
}
