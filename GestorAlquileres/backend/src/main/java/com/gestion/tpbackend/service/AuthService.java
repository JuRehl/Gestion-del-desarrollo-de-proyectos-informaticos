package com.gestion.tpbackend.service;

import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.UsuarioRepository;
import com.gestion.tpbackend.security.JwtService;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
        UsuarioRepository usuarioRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResult login(String email, String contrasena) {
        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        if (!esPasswordValido(contrasena, usuario)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        String token = jwtService.generarToken(usuario);
        Instant expiraEn = jwtService.extraerExpiracion(token).toInstant();

        return new LoginResult(token, expiraEn.toEpochMilli(), usuario);
    }

    private boolean esPasswordValido(String rawPassword, Usuario usuario) {
        String storedPassword = usuario.getContrasena();

        if (passwordEncoder.matches(rawPassword, storedPassword)) {
            return true;
        }

        // Compatibilidad temporal con passwords existentes en texto plano.
        if (rawPassword.equals(storedPassword)) {
            usuario.setContrasena(passwordEncoder.encode(rawPassword));
            usuarioRepository.save(usuario);
            return true;
        }

        return false;
    }

    public record LoginResult(String token, long expiraEnEpochMs, Usuario usuario) {
    }
}
