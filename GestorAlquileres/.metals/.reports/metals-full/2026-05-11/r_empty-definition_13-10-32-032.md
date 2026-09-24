error id: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/controller/ContratoController.java:
file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/controller/ContratoController.java
empty definition using pc, found symbol in pc: 
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 3978
uri: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/controller/ContratoController.java
text:
```scala
package com.gestion.tpbackend.controller;

import com.gestion.tpbackend.entity.Contrato;
import com.gestion.tpbackend.entity.Contrato.MetodoPago;
import com.gestion.tpbackend.entity.HistorialContrato;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.HistorialContratoRepository;
import com.gestion.tpbackend.repository.UsuarioRepository;
import com.gestion.tpbackend.service.ContratoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
public class ContratoController {

    private final ContratoService contratoService;
    private final HistorialContratoRepository historialContratoRepository;
    private final UsuarioRepository usuarioRepository;

    public ContratoController(ContratoService contratoService, 
                             HistorialContratoRepository historialContratoRepository,
                             UsuarioRepository usuarioRepository) {
        this.contratoService = contratoService;
        this.historialContratoRepository = historialContratoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @PreAuthorize("hasRole('INQ')")
    @GetMapping("/mis-contratos")
    public ResponseEntity<List<HistorialContrato>> misContratos(Authentication auth) {
        Usuario inquilino = usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));
        return ResponseEntity.ok(historialContratoRepository.findByInquilinoId(inquilino.getId()));
    }

    @PreAuthorize("hasAnyRole('INQ', 'ADMIN')")
    @GetMapping("/inquilino/{inquilinoId}/historial")
    public ResponseEntity<HistorialCompletoResponse> historialInquilino(@PathVariable Long inquilinoId) {
        List<Contrato> pagos = contratoService.obtenerPorInquilinoId(inquilinoId);
        List<HistorialContrato> contratos = historialContratoRepository.findByInquilinoId(inquilinoId);
        return ResponseEntity.ok(new HistorialCompletoResponse(pagos, contratos));
    }

    public record HistorialCompletoResponse(List<Contrato> pagos, List<HistorialContrato> contratos) {}

    @PreAuthorize("hasRole('INQ')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Contrato registrarPago(@RequestBody PagoRequest request, Authentication auth) {
        String email = auth.getName();
        MetodoPago metodo = MetodoPago.valueOf(request.metodo().toUpperCase());
        return contratoService.registrarPago(email, request.edificioId(), request.monto(), metodo, request.nota());
    }

    @PreAuthorize("hasRole('INQ')")
    @GetMapping("/mis-pagos")
    public ResponseEntity<List<Contrato>> misPagos(Authentication auth) {
        return ResponseEntity.ok(contratoService.obtenerPorInquilino(auth.getName()));
    }

    @GetMapping("/edificio/{edificioId}")
    public ResponseEntity<List<Contrato>> pagosPorEdificio(@PathVariable Long edificioId) {
        return ResponseEntity.ok(contratoService.obtenerPorEdificio(edificioId));
    }

    @GetMapping
    public ResponseEntity<List<Contrato>> todos() {
        return ResponseEntity.ok(contratoService.obtenerTodos());
    }

    @PatchMapping("/{id}/confirmar")
    public ResponseEntity<Contrato> confirmar(@PathVariable Long id, @RequestBody(required = false) ConfirmarPagoRequest request) {
        Double monto = request != null ? request.monto() : null;
        return ResponseEntity.ok(contratoService.marcarComoPagado(id, monto));
    }

    public record PagoRequest(Long edificioId, Double monto, String metodo, String nota) {}
    public record ConfirmarPagoRequest(Double monto) {}
    @@public record PagoRequest(Long edificioId, Double monto, String metodo, String nota, String estado) {}
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: 