package com.medivet.helpanimal.exception;

import org.springframework.http.HttpStatus;

/** 409 : une autre acceptation a deja ete validee (RM04). */
public class MissionAlreadyAssignedException extends ApiException {

    public MissionAlreadyAssignedException() {
        super(HttpStatus.CONFLICT, "Mission deja attribuee");
    }
}
