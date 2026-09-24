package com.gestion.tpbackend.controller;

import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult loginResult = authService.login(request.email(), request.contrasena());
        Usuario usuario = loginResult.usuario();

        return new LoginResponse(
            loginResult.token(),
            "Bearer",
            loginResult.expiraEnEpochMs(),
            new UsuarioResumen(usuario.getId(), usuario.getNombre(), usuario.getEmail(), usuario.getRol().name())
        );
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String contrasena) {
    }

    public record UsuarioResumen(Long id, String nombre, String email, String rol) {
    }

    public record LoginResponse(String token, String tipo, long expiraEnEpochMs, UsuarioResumen usuario) {
    }
}
