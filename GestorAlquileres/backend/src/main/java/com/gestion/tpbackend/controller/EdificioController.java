package com.gestion.tpbackend.controller;

import com.gestion.tpbackend.entity.Edificio;
import com.gestion.tpbackend.service.EdificioService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/edificios")
public class EdificioController {

    private final EdificioService edificioService;

    public EdificioController(EdificioService edificioService) {
        this.edificioService = edificioService;
    }

    @GetMapping
    public List<Edificio> listar(Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            return edificioService.obtenerPorPropietario(auth.getName());
        }
        
        return edificioService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public Edificio obtener(@PathVariable Long id) {
        return edificioService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Edificio crear(@RequestBody EdificioRequest request) {
        return edificioService.crear(
            request.nombre(),
            request.direccion(),
            request.cantidadDepartamentos(),
            request.cantidadInquilinos(),
            request.expensasBase(),
            request.propietarioId()
        );
    }

    @PutMapping("/{id}")
    public Edificio actualizar(@PathVariable Long id, @RequestBody EdificioRequest request) {
        return edificioService.actualizar(
            id,
            request.nombre(),
            request.direccion(),
            request.cantidadDepartamentos(),
            request.cantidadInquilinos(),
            request.expensasBase(),
            request.propietarioId()
        );
    }

    @PatchMapping("/{id}/gastos-extra")
    public Edificio agregarGastoExtra(@PathVariable Long id, @RequestBody AgregarGastoExtraRequest request) {
        return edificioService.agregarGastoExtra(id, request.monto());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        edificioService.eliminar(id);
    }

    public record EdificioRequest(String nombre, String direccion, Integer cantidadDepartamentos, Integer cantidadInquilinos, Double expensasBase, Long propietarioId) {
    }

    public record AgregarGastoExtraRequest(Double monto) {
    }

    @GetMapping("/mis-edificios")
    public ResponseEntity<List<Edificio>> getMisEdificios(Authentication auth) {
        String email = auth.getName(); 
        List<Edificio> edificios = edificioService.getEdificiosDelInquilinoPorEmail(email);
        return ResponseEntity.ok(edificios);
    }
}
