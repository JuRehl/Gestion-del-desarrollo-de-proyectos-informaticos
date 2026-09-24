error id: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/controller/UsuarioController.java:_empty_/UsuarioService#verificarYActualizarEstado#
file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/controller/UsuarioController.java
empty definition using pc, found symbol in pc: _empty_/UsuarioService#verificarYActualizarEstado#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 784
uri: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/controller/UsuarioController.java
text:
```scala
package com.gestion.tpbackend.controller;

import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.service.UsuarioService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public List<Usuario> listar() {
        return usuarioService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public Usuario obtener(@PathVariable Long id) {
        Usuario usuario = usuarioService.obtenerPorId(id);
        return usuarioService.verifi@@carYActualizarEstado(usuario);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Usuario crear(@RequestBody Usuario usuario) {
        return usuarioService.crear(usuario);
    }

    @PutMapping("/{id}")
    public Usuario actualizar(@PathVariable Long id, @RequestBody Usuario usuario) {
        return usuarioService.actualizar(id, usuario);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: _empty_/UsuarioService#verificarYActualizarEstado#