package com.gestion.tpbackend.controller;

import com.gestion.tpbackend.entity.Deuda;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.UsuarioRepository;
import com.gestion.tpbackend.service.DeudaService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/deudas")
public class DeudaController {

    private final DeudaService deudaService;
    private final UsuarioRepository usuarioRepository;

    public DeudaController(DeudaService deudaService, UsuarioRepository usuarioRepository) {
        this.deudaService = deudaService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/mis-deudas")
    public ResponseEntity<List<DeudaResponse>> misDeudas(Authentication auth) {
        Usuario inquilino = usuarioRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));

        List<DeudaResponse> deudas = deudaService.obtenerPendientesPorInquilino(inquilino.getId())
            .stream()
            .map(this::toResponse)
            .toList();

        return ResponseEntity.ok(deudas);
    }

    @GetMapping("/inquilino/{inquilinoId}/edificio/{edificioId}/total")
    public ResponseEntity<TotalDeudaResponse> totalPorInquilinoYEdificio(
        @PathVariable Long inquilinoId,
        @PathVariable Long edificioId
    ) {
        Double total = deudaService.obtenerTotalPendiente(inquilinoId, edificioId);
        return ResponseEntity.ok(new TotalDeudaResponse(total));
    }

    private DeudaResponse toResponse(Deuda deuda) {
        return new DeudaResponse(
            deuda.getId(),
            deuda.getEdificio() != null ? deuda.getEdificio().getId() : null,
            deuda.getTipo().name(),
            deuda.getPeriodo(),
            deuda.getMontoOriginal(),
            deuda.getMontoPagado(),
            deuda.getMontoPendiente(),
            deuda.getEstado().name(),
            deuda.getDescripcion()
        );
    }

    public record DeudaResponse(
        Long id,
        Long edificioId,
        String tipo,
        String periodo,
        Double montoOriginal,
        Double montoPagado,
        Double montoPendiente,
        String estado,
        String descripcion
    ) {
    }

    public record TotalDeudaResponse(Double totalPendiente) {
    }
}
