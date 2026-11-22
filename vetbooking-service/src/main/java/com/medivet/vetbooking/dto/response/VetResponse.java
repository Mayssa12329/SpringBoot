package com.medivet.vetbooking.dto.response;

import com.medivet.vetbooking.enums.ConsultationType;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Veterinarian profile returned by the API")
public class VetResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String clinicName;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private ConsultationType consultationType;
    private boolean active;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
