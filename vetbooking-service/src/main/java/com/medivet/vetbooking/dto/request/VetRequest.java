package com.medivet.vetbooking.dto.request;

import com.medivet.vetbooking.enums.ConsultationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Payload to register or update a veterinarian")
public class VetRequest {

    @NotBlank(message = "First name is required")
    @Schema(example = "Alice")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Schema(example = "Dupont")
    private String lastName;

    @Email(message = "Must be a valid email")
    @NotBlank(message = "Email is required")
    @Schema(example = "alice.dupont@clinic.fr")
    private String email;

    @Schema(example = "+33600000000")
    private String phone;

    @NotBlank(message = "Clinic name is required")
    @Schema(example = "Clinique des Lilas")
    private String clinicName;

    @Schema(example = "12 rue de la Paix")
    private String address;

    @Schema(example = "Paris")
    private String city;

    @Schema(example = "48.8566")
    private Double latitude;

    @Schema(example = "2.3522")
    private Double longitude;

    @NotNull(message = "Consultation type is required")
    @Schema(example = "GENERAL")
    private ConsultationType consultationType;

    // ── Getters & Setters ───────────────────────────────────────────────────

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
}
