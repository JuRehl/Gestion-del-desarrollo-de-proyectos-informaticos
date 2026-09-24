package com.gestion.tpbackend.security;

import com.gestion.tpbackend.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    public String generarToken(Usuario usuario) {

        ZoneId zonaBsAs = ZoneId.of("America/Argentina/Buenos_Aires");
        ZonedDateTime ahoraBsAs = ZonedDateTime.now(zonaBsAs);
        Instant issuedAt = ahoraBsAs.toInstant();
        Instant expiration = issuedAt.plusMillis(jwtExpirationMs);

        System.out.println(issuedAt);
        System.out.println(expiration);

        Date issuedAtDate = Date.from(issuedAt);
        Date expirationDate = Date.from(expiration);

        System.out.println(issuedAtDate);
        System.out.println(expirationDate);

        return Jwts.builder()
            .subject(usuario.getEmail())
            .claims(Map.of("rol", usuario.getRol().name()))
            .issuedAt(issuedAtDate)
            .expiration(expirationDate)
            .signWith(obtenerLlaveFirma())
            .compact();
    }

    public String extraerEmail(String token) {
        return extraerClaims(token).getSubject();
    }

    public Date extraerExpiracion(String token) {
        return extraerClaims(token).getExpiration();
    }

    public boolean esTokenValido(String token, UserDetails userDetails) {
        String email = extraerEmail(token);
        return email.equals(userDetails.getUsername()) && !esTokenExpirado(token);
    }

    private boolean esTokenExpirado(String token) {
        return extraerExpiracion(token).before(new Date());
    }

    private Claims extraerClaims(String token) {
        return Jwts.parser()
            .verifyWith(obtenerLlaveFirma())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey obtenerLlaveFirma() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
