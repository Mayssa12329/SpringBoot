package com.medivet.vetbooking.entity;

import com.medivet.vetbooking.enums.ConsultationType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a veterinarian registered on the platform.
 * Each vet has exactly ONE consultation type / specialty (RM07).
 */
@Entity
@Table(name = "vets")
public class Vet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String firstName;

    @NotBlank
    @Column(nullable = false)
    private String lastName;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String phone;

    @NotBlank
    @Column(nullable = false)
    private String clinicName;

    @Column
    private String address;

    @Column
    private String city;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    /**
     * The single specialty of this vet (RM07).
     * Stored as a plain column — no join table needed anymore.
     */
    @NotNull(message = "Consultation type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "consultation_type", nullable = false)
    private ConsultationType consultationType;

    @OneToMany(mappedBy = "vet", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Slot> slots = new ArrayList<>();

    @Column(nullable = false)
    private boolean active = true;

    // ── Constructors ────────────────────────────────────────────────────────

    public Vet() {}

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getClinicName() { return clinicName; }
    public void setClinicName(String clinicName) { this.clinicName = clinicName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public ConsultationType getConsultationType() { return consultationType; }
    public void setConsultationType(ConsultationType consultationType) { this.consultationType = consultationType; }

    public List<Slot> getSlots() { return slots; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
