package tn.medivet.adoptanimal.client;

/** Verdicts du registre VetInterop (RM10) + INDISPONIBLE quand le registre est en panne (RM13). */
public enum IdentiteVerdict {
    VERIFIED, NOT_FOUND, INCONSISTENT, UNDETERMINED, INDISPONIBLE
}
