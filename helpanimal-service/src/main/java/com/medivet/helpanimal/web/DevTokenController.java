package com.medivet.helpanimal.web;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import com.medivet.helpanimal.security.Role;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * DEV UNIQUEMENT : fabrique un jeton JWT pour tester sans UserService.
 * Exemple : GET /api/dev/token?userId=1&roles=CITOYEN
 * Desactiver en production : security.dev-tokens.enabled=false
 */
@RestController
@RequestMapping("/api/dev")
@ConditionalOnProperty(prefix = "security.dev-tokens", name = "enabled", havingValue = "true")
public class DevTokenController {

    private final JwtEncoder jwtEncoder;

    public DevTokenController(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    @GetMapping("/token")
    public Map<String, Object> token(@RequestParam Long userId, @RequestParam List<Role> roles) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("medivet-dev")
            .subject(String.valueOf(userId))
            .issuedAt(now)
            .expiresAt(now.plus(8, ChronoUnit.HOURS))
            .claim("roles", roles.stream().map(Enum::name).toList())
            .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return Map.of("token", token, "userId", userId, "roles", roles);
    }
}
