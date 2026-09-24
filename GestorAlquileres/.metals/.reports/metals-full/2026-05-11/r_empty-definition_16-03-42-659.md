error id: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/service/UsuarioService.java:java/lang/Long#
file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/service/UsuarioService.java
empty definition using pc, found symbol in pc: java/lang/Long#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 1812
uri: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/service/UsuarioService.java
text:
```scala
package com.gestion.tpbackend.service;
import java.time.LocalDateTime;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.UsuarioRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.gestion.tpbackend.entity.RolUsuario;
import org.springframework.beans.factory.annotation.Value;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    @Value("${app.admin.creation.password}")
    private String adminCreationPassword;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Usuario> obtenerTodos() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        LocalDateTime ahora = LocalDateTime.now();

        for (Usuario u : usuarios) {
            if (u.isActivo() && u.getFechaFinContrato() != null && ahora.isAfter(u.getFechaFinContrato())) {
                u.setActivo(false);
                usuarioRepository.save(u); 
            }
        }
        return usuarios;
    }

    public Usuario verificarYActualizarEstado(Usuario usuario) {
    if (usuario.isActivo() && usuario.getFechaFinContrato() != null) {
        if (LocalDateTime.now().isAfter(usuario.getFechaFinContrato())) {
            usuario.setActivo(false);
            return usuarioRepository.save(usuario); // Guarda el cambio en la DB
        }
    }
    return usuario;
    }

    public Usuario obtenerPorId(Lo@@ng id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    public Usuario crear(Usuario usuario) {
        System.out.println("ROL: " + usuario.getRol());
        System.out.println("CLAVE: " + usuario.getClaveSecreta());
        if (usuario.getRol() == RolUsuario.ADMIN || usuario.getRol() == RolUsuario.PROP) {
            if (usuario.getClaveSecreta() == null || !adminCreationPassword.equals(usuario.getClaveSecreta())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Clave de acceso incorrecta");
            }
        }
        usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));
        return usuarioRepository.save(usuario);
    }

    public Usuario actualizar(Long id, Usuario datos) {
        Usuario usuario = obtenerPorId(id);
        usuario.setNombre(datos.getNombre());
        usuario.setEmail(datos.getEmail());
        usuario.setRol(datos.getRol());

        if (datos.getContrasena() != null && !datos.getContrasena().isBlank()) {
            usuario.setContrasena(passwordEncoder.encode(datos.getContrasena()));
        }

        return usuarioRepository.save(usuario);
    }

    public void eliminar(Long id) {
        Usuario usuario = obtenerPorId(id);
        usuarioRepository.delete(usuario);
    }
}

```


#### Short summary: 

empty definition using pc, found symbol in pc: java/lang/Long#