package com.gestion.tpbackend.service;

import com.gestion.tpbackend.entity.Edificio;
import com.gestion.tpbackend.entity.Gasto;
import com.gestion.tpbackend.repository.EdificioRepository;
import com.gestion.tpbackend.repository.GastoRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GastoService {

    private final GastoRepository gastoRepository;
    private final EdificioRepository edificioRepository;
    private final DeudaService deudaService;
    private final Path receiptsBaseDir;
    private final long maxReceiptSizeBytes;

    public GastoService(
        GastoRepository gastoRepository,
        EdificioRepository edificioRepository,
        DeudaService deudaService,
        @Value("${app.receipts.dir:uploads/receipts}") String receiptsDir,
        @Value("${app.receipts.max-size-bytes:5242880}") long maxReceiptSizeBytes
    ) {
        this.gastoRepository = gastoRepository;
        this.edificioRepository = edificioRepository;
        this.deudaService = deudaService;
        this.receiptsBaseDir = Paths.get(receiptsDir).toAbsolutePath().normalize();
        this.maxReceiptSizeBytes = maxReceiptSizeBytes;

        try {
            Files.createDirectories(this.receiptsBaseDir);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo inicializar el directorio de comprobantes", e);
        }
    }

    @Transactional
    public Gasto crearGasto(Long edificioId, String tipo, Double monto, String descripcion, MultipartFile comprobante) {
        if (!StringUtils.hasText(tipo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo de gasto es obligatorio");
        }
        if (monto == null || monto <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El monto debe ser mayor a 0");
        }
        if (comprobante == null || comprobante.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe adjuntar un comprobante");
        }
        if (comprobante.getSize() > maxReceiptSizeBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comprobante supera el tamano maximo permitido");
        }

        String contentType = comprobante.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comprobante debe ser una imagen");
        }

        Edificio edificio = edificioRepository.findById(edificioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Edificio no encontrado"));

        String originalName = StringUtils.cleanPath(comprobante.getOriginalFilename() != null ? comprobante.getOriginalFilename() : "comprobante");
        String extension = obtenerExtension(originalName);
        String storedName = UUID.randomUUID() + extension;

        Path targetPath = receiptsBaseDir.resolve(storedName).normalize();
        if (!targetPath.startsWith(receiptsBaseDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo invalido");
        }

        try {
            Files.copy(comprobante.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el comprobante");
        }

        Gasto gasto = new Gasto();
        gasto.setEdificio(edificio);
        gasto.setTipo(tipo.trim());
        gasto.setMonto(monto);
        gasto.setDescripcion(StringUtils.hasText(descripcion) ? descripcion.trim() : null);
        gasto.setFecha(LocalDateTime.now());
        gasto.setComprobanteOriginal(originalName);
        gasto.setComprobantePath(storedName);
        gasto.setComprobanteContentType(contentType);

        Double gastoActual = edificio.getGastosExtra() != null ? edificio.getGastosExtra() : 0.0;
        edificio.setGastosExtra(gastoActual + monto);

        deudaService.distribuirNuevoGastoExtra(
            edificio,
            monto,
            StringUtils.hasText(descripcion) ? descripcion.trim() : null,
            YearMonth.now()
        );

        return gastoRepository.save(gasto);
    }

    @Transactional(readOnly = true)
    public List<Gasto> listarGastos(Long edificioId, String month) {
        if (month != null && !month.isBlank()) {
            YearMonth yearMonth;
            try {
                yearMonth = YearMonth.parse(month);
            } catch (DateTimeParseException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El mes debe tener formato YYYY-MM");
            }

            LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
            LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

            if (edificioId != null) {
                return gastoRepository.findByEdificioIdAndFechaBetweenOrderByFechaDesc(edificioId, start, end);
            }
            return gastoRepository.findByFechaBetweenOrderByFechaDesc(start, end);
        }

        if (edificioId != null) {
            return gastoRepository.findByEdificioIdOrderByFechaDesc(edificioId);
        }
        return gastoRepository.findAllByOrderByFechaDesc();
    }

    @Transactional(readOnly = true)
    public Gasto obtenerPorId(Long gastoId) {
        return gastoRepository.findById(gastoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto no encontrado"));
    }

    @Transactional(readOnly = true)
    public Path obtenerRutaComprobante(Gasto gasto) {
        Path path = receiptsBaseDir.resolve(gasto.getComprobantePath()).normalize();
        if (!path.startsWith(receiptsBaseDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de comprobante invalida");
        }
        if (!Files.exists(path) || !Files.isReadable(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comprobante no encontrado");
        }
        return path;
    }

    private String obtenerExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx < 0 || idx == filename.length() - 1) {
            return "";
        }
        String extension = filename.substring(idx);
        if (extension.length() > 10) {
            return "";
        }
        return extension;
    }
}