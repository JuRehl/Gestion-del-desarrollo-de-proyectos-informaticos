package com.gestion.tpbackend.service;

import com.gestion.tpbackend.entity.Edificio;
import com.gestion.tpbackend.entity.Deuda;
import com.gestion.tpbackend.entity.HistorialContrato;
import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.EdificioRepository;
import com.gestion.tpbackend.repository.DeudaRepository;
import com.gestion.tpbackend.repository.HistorialContratoRepository;
import com.gestion.tpbackend.repository.UnidadRepository;
import com.gestion.tpbackend.repository.UsuarioRepository;
import com.gestion.tpbackend.repository.NotificacionRepository;
import com.gestion.tpbackend.entity.Notificacion;
import java.time.YearMonth;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UnidadService {

    private final UnidadRepository unidadRepository;
    private final EdificioRepository edificioRepository;
    private final UsuarioRepository usuarioRepository;
    private final DeudaRepository deudaRepository;
    private final HistorialContratoRepository historialContratoRepository;
    private final DeudaService deudaService;
    private final EmailService emailService;
    private final NotificacionRepository notificacionRepository;

    public UnidadService(
        UnidadRepository unidadRepository,
        EdificioRepository edificioRepository,
        UsuarioRepository usuarioRepository,
        DeudaRepository deudaRepository,
        HistorialContratoRepository historialContratoRepository,
        DeudaService deudaService
        ,EmailService emailService,
        NotificacionRepository notificacionRepository
    ) {
        this.unidadRepository = unidadRepository;
        this.edificioRepository = edificioRepository;
        this.usuarioRepository = usuarioRepository;
        this.deudaRepository = deudaRepository;
        this.historialContratoRepository = historialContratoRepository;
        this.deudaService = deudaService;
        this.emailService = emailService;
        this.notificacionRepository = notificacionRepository;
    }

    public List<Unidad> obtenerTodas() {
        return unidadRepository.findAll();
    }

    public List<Unidad> obtenerPorEdificio(Long edificioId) {
        return unidadRepository.findByEdificioId(edificioId);
    }

    public Unidad obtenerPorId(Long id) {
        return unidadRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidad no encontrada"));
    }

    public Unidad crear(String nombre, Double m2, String piso, Long edificioId) {
        Edificio edificio = edificioRepository.findById(edificioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Edificio no encontrado"));
        Unidad unidad = new Unidad(nombre, m2, piso, edificio);
        return unidadRepository.save(unidad);
    }

    public Unidad asignarInquilino(Long unidadId, Long inquilinoId) {
        Unidad unidad = obtenerPorId(unidadId);
        Usuario inquilino = usuarioRepository.findById(inquilinoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));
        
        // Cerrar historial previo si existia
        cerrarHistorialActual(unidad);

        unidad.setInquilino(inquilino);
        Unidad unidadGuardada = unidadRepository.save(unidad);

        deudaService.asegurarDeudaBaseMensual(unidadGuardada, YearMonth.now());
        
        // Crear nuevo historial
        HistorialContrato historial = new HistorialContrato(unidad, inquilino, unidad.getMontoAlquiler() != null ? unidad.getMontoAlquiler() : 0.0, unidad.getVencimientoContrato(), java.time.LocalDateTime.now());
        historialContratoRepository.save(historial);

        actualizarCantidadInquilinos(unidad.getEdificio());
        
        return unidadGuardada;
    }

    public Unidad asignarInquilinoPorEmail(Long edificioId, String piso, String nombre, String email, Double montoAlquiler, Double porcentajeDepartamento, Integer diaPago, String vencimientoContrato) {
        Usuario inquilino = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario con email " + email + " no existe."));
            
        Edificio edificio = edificioRepository.findById(edificioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Edificio no encontrado"));
            
        Unidad unidad = unidadRepository.findByEdificioIdAndPisoAndNombre(edificioId, piso, nombre)
            .orElseGet(() -> new Unidad(nombre, 0.0, piso, edificio));
            
        // Cerrar historial previo si el inquilino cambia o se esta re-asignando
        if (unidad.getInquilino() != null) {
            cerrarHistorialActual(unidad);
        }

        unidad.setInquilino(inquilino);
        unidad.setMontoAlquiler(montoAlquiler);
        unidad.setPorcentajeDepartamento(porcentajeDepartamento);
        unidad.setDiaPago(diaPago);
        unidad.setVencimientoContrato(vencimientoContrato);
        
        Unidad unidadGuardada = unidadRepository.save(unidad);

        deudaService.asegurarDeudaBaseMensual(unidadGuardada, YearMonth.now());
        
        // Crear nuevo historial
        HistorialContrato historial = new HistorialContrato(unidad, inquilino, montoAlquiler, vencimientoContrato, java.time.LocalDateTime.now());
        historialContratoRepository.save(historial);

        actualizarCantidadInquilinos(edificio);
        
        return unidadGuardada;
    }

    public void quitarInquilino(Long unidadId) {
        Unidad unidad = obtenerPorId(unidadId);
        
        cerrarHistorialActual(unidad);

        unidad.setInquilino(null);
        unidad.setMontoAlquiler(null);
        unidad.setDiaPago(null);
        unidad.setVencimientoContrato(null);
        
        unidadRepository.save(unidad);
        actualizarCantidadInquilinos(unidad.getEdificio());
    }

    @Transactional
    public Unidad aumentarAlquiler(Long unidadId, Double incrementoPorcentaje) {
        if (incrementoPorcentaje == null || incrementoPorcentaje <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El incremento debe ser mayor a 0");
        }

        Unidad unidad = obtenerPorId(unidadId);
        if (unidad.getInquilino() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La unidad no tiene un inquilino asignado");
        }

        Double alquilerActual = unidad.getMontoAlquiler();
        if (alquilerActual == null || alquilerActual <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La unidad no tiene un alquiler vigente");
        }

        double nuevoAlquiler = redondear(alquilerActual * (1 + incrementoPorcentaje / 100.0));
        unidad.setMontoAlquiler(nuevoAlquiler);
        Unidad unidadGuardada = unidadRepository.save(unidad);

        actualizarHistorialContrato(unidadGuardada, nuevoAlquiler);
        sincronizarDeudaMensual(unidadGuardada, nuevoAlquiler);

        // Preparar datos para notificación
        Double montoAnterior = alquilerActual;
        Double montoAumento = redondear(nuevoAlquiler - montoAnterior);
        Double porcentaje = incrementoPorcentaje;
        String fechaEfecto = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        // Obtener datos de inquilino
        Usuario inquilino = unidadGuardada.getInquilino();
        Double deudaPendiente = deudaRepository.findByUnidadIdAndPeriodoAndTipo(unidadGuardada.getId(), YearMonth.now().toString(), Deuda.TipoDeuda.ALQUILER)
            .map(Deuda::getMontoPendiente).orElse(0.0);

        // Enviar email (si tiene email)
        if (inquilino != null && inquilino.getEmail() != null && !inquilino.getEmail().isBlank()) {
            try {
                emailService.enviarAvisoAumentoAlquiler(
                    inquilino.getEmail(),
                    inquilino.getNombre(),
                    unidadGuardada,
                    montoAnterior,
                    montoAumento,
                    nuevoAlquiler,
                    porcentaje,
                    fechaEfecto,
                    unidadGuardada.getEdificio().getPropietario() != null ? unidadGuardada.getEdificio().getPropietario().getNombre() : "Administrador",
                    deudaPendiente
                );

                Notificacion notif = new Notificacion(inquilino, unidadGuardada,
                    "Ajuste de alquiler: $" + montoAumento + " (" + porcentaje + "%)",
                    "Tu alquiler cambió de $" + montoAnterior + " a $" + nuevoAlquiler + ". Fecha de efecto: " + fechaEfecto,
                    String.format("{\"montoAnterior\":%s,\"montoAumento\":%s,\"montoNuevo\":%s,\"porcentaje\":%s}", montoAnterior, montoAumento, nuevoAlquiler, porcentaje),
                    Notificacion.Canal.EMAIL
                );
                notif.setEstado(Notificacion.Estado.ENVIADO);
                notificacionRepository.save(notif);
            } catch (Exception ex) {
                Notificacion notif = new Notificacion(inquilino, unidadGuardada,
                    "Ajuste de alquiler: $" + montoAumento + " (" + porcentaje + "%)",
                    "Intento de notificación fallido: " + ex.getMessage(),
                    String.format("{\"error\":\"%s\"}", ex.getMessage()),
                    Notificacion.Canal.EMAIL
                );
                notif.setEstado(Notificacion.Estado.ERROR);
                notificacionRepository.save(notif);
            }
        }

        return unidadGuardada;
    }

    @Transactional
    public Unidad renovarContrato(Long unidadId, String nuevoVencimiento, Double nuevoMontoAlquiler) {
        Unidad unidad = obtenerPorId(unidadId);
        if (unidad.getInquilino() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La unidad no tiene un inquilino asignado");
        }

        // Cerrar historial previo
        cerrarHistorialActual(unidad);

        // Actualizar datos de la unidad
        unidad.setVencimientoContrato(nuevoVencimiento);
        unidad.setMontoAlquiler(nuevoMontoAlquiler);
        Unidad unidadGuardada = unidadRepository.save(unidad);

        // Crear nuevo historial
        HistorialContrato historial = new HistorialContrato(
            unidadGuardada,
            unidadGuardada.getInquilino(),
            nuevoMontoAlquiler,
            nuevoVencimiento,
            java.time.LocalDateTime.now()
        );
        historialContratoRepository.save(historial);

        return unidadGuardada;
    }

    private void cerrarHistorialActual(Unidad unidad) {
        List<HistorialContrato> historiales = historialContratoRepository.findByUnidadId(unidad.getId());
        historiales.stream()
            .filter(h -> h.getFechaFin() == null)
            .forEach(h -> {
                h.setFechaFin(java.time.LocalDateTime.now());
                historialContratoRepository.save(h);
            });
    }

    private void actualizarHistorialContrato(Unidad unidad, Double nuevoMontoAlquiler) {
        cerrarHistorialActual(unidad);

        HistorialContrato historial = new HistorialContrato(
            unidad,
            unidad.getInquilino(),
            nuevoMontoAlquiler,
            unidad.getVencimientoContrato(),
            java.time.LocalDateTime.now()
        );
        historialContratoRepository.save(historial);
    }

    private void sincronizarDeudaMensual(Unidad unidad, Double nuevoMontoAlquiler) {
        String periodoActual = YearMonth.now().toString();
        deudaRepository.findByUnidadIdAndPeriodoAndTipo(unidad.getId(), periodoActual, Deuda.TipoDeuda.ALQUILER)
            .ifPresent(deuda -> {
                if (deuda.getEstado() == Deuda.EstadoDeuda.CANCELADA) {
                    return;
                }

                double montoPagado = valor(deuda.getMontoPagado());
                double montoPendiente = redondear(Math.max(0.0, nuevoMontoAlquiler - montoPagado));

                deuda.setMontoOriginal(nuevoMontoAlquiler);
                deuda.setMontoPendiente(montoPendiente);
                deuda.setEstado(montoPendiente <= 0.00001
                    ? Deuda.EstadoDeuda.CANCELADA
                    : (montoPagado > 0 ? Deuda.EstadoDeuda.PARCIAL : Deuda.EstadoDeuda.PENDIENTE));
                deudaRepository.save(deuda);
            });
    }

    private void actualizarCantidadInquilinos(Edificio edificio) {
        List<Unidad> unidades = unidadRepository.findByEdificioId(edificio.getId());
        long count = unidades.stream()
            .filter(u -> u.getInquilino() != null)
            .count();
        edificio.setCantidadInquilinos((int) count);
        edificioRepository.save(edificio);
    }

    public void eliminar(Long id) {
        Unidad unidad = obtenerPorId(id);
        Edificio edificio = unidad.getEdificio();
        unidadRepository.delete(unidad);
        actualizarCantidadInquilinos(edificio);
    }

    private double valor(Double number) {
        return number == null ? 0.0 : number;
    }

    private double redondear(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}