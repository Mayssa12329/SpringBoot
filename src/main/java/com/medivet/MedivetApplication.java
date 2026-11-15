package com.medivet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling   // Required for WaitingListService expiry scheduler (RM08)
@EnableAsync        // Required for @Async on NotificationService listener (US17)
public class MedivetApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedivetApplication.class, args);
    }

}

