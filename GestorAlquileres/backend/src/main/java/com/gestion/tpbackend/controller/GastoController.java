package com.gestion.tpbackend.controller;

import com.gestion.tpbackend.entity.Gasto;
import com.gestion.tpbackend.service.GastoService;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class GastoController {

    private final GastoService gastoService;

    public GastoController(GastoService gastoService) {
        this.gastoService = gastoService;
    }

    @PostMapping(value = "/edificios/{edificioId}/gastos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public GastoResponse crearGasto(
        @PathVariable Long edificioId,
        @RequestParam("type") String type,
        @RequestParam("amount") Double amount,
        @RequestParam(value = "description", required = false) String description,
        @RequestParam("receipt") MultipartFile receipt
    ) {
        Gasto gasto = gastoService.crearGasto(edificioId, type, amount, description, receipt);
        return toResponse(gasto);
    }

    @GetMapping("/gastos")
    public List<GastoResponse> listarGastos(
        @RequestParam(value = "edificioId", required = false) Long edificioId,
        @RequestParam(value = "month", required = false) String month
    ) {
        return gastoService.listarGastos(edificioId, month)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @GetMapping("/gastos/{gastoId}/comprobante")
    public ResponseEntity<Resource> verComprobante(@PathVariable Long gastoId) throws IOException {
        Gasto gasto = gastoService.obtenerPorId(gastoId);
        Path comprobante = gastoService.obtenerRutaComprobante(gasto);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(gasto.getComprobanteContentType());
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        InputStreamResource resource = new InputStreamResource(java.nio.file.Files.newInputStream(comprobante));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDisposition(ContentDisposition.inline().filename(gasto.getComprobanteOriginal(), StandardCharsets.UTF_8).build());

        return ResponseEntity.ok()
            .headers(headers)
            .body(resource);
    }

    private GastoResponse toResponse(Gasto gasto) {
        return new GastoResponse(
            gasto.getId(),
            gasto.getEdificio().getId(),
            gasto.getTipo(),
            gasto.getMonto(),
            gasto.getDescripcion(),
            gasto.getFecha(),
            gasto.getComprobanteOriginal(),
            "/api/gastos/" + gasto.getId() + "/comprobante"
        );
    }

    public record GastoResponse(
        Long id,
        Long buildingId,
        String type,
        Double amount,
        String description,
        java.time.LocalDateTime date,
        String receiptFileName,
        String receiptUrl
    ) {
    }
}