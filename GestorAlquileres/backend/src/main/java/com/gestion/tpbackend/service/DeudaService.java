package com.gestion.tpbackend.service;

import com.gestion.tpbackend.entity.Contrato;
import com.gestion.tpbackend.entity.Deuda;
import com.gestion.tpbackend.entity.Deuda.EstadoDeuda;
import com.gestion.tpbackend.entity.Deuda.TipoDeuda;
import com.gestion.tpbackend.entity.Edificio;
import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.repository.DeudaRepository;
import com.gestion.tpbackend.repository.EdificioRepository;
import com.gestion.tpbackend.repository.UnidadRepository;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeudaService {

    public record AplicacionDetalle(Long deudaId, String tipo, String periodo, Double montoAplicado, Double pendienteTrasAplicacion) {
    }

    public record ResultadoAplicacion(Double montoAplicado, Double deudaPendienteTotal, List<AplicacionDetalle> detalles) {
    }

    private static final List<EstadoDeuda> ESTADOS_ABIERTOS = List.of(EstadoDeuda.PENDIENTE, EstadoDeuda.PARCIAL);

    private final DeudaRepository deudaRepository;
    private final UnidadRepository unidadRepository;
    private final EdificioRepository edificioRepository;

    public DeudaService(DeudaRepository deudaRepository, UnidadRepository unidadRepository, EdificioRepository edificioRepository) {
        this.deudaRepository = deudaRepository;
        this.unidadRepository = unidadRepository;
        this.edificioRepository = edificioRepository;
    }

    @Transactional
    public void asegurarDeudaBaseMensual(Unidad unidad, YearMonth periodo) {
        if (unidad.getInquilino() == null) {
            return;
        }

        String period = periodo.toString();
        asegurarDeudaMensualRodante(unidad, period, TipoDeuda.ALQUILER, valor(unidad.getMontoAlquiler()), "Alquiler mensual");

        double porcentaje = porcentajeNormalizado(unidad.getPorcentajeDepartamento());
        double expensasBase = valor(unidad.getEdificio().getExpensasBase()) * porcentaje;
        asegurarDeudaMensualRodante(unidad, period, TipoDeuda.EXPENSAS_BASE, expensasBase, "Expensas base");

        asegurarDeudaExtraAcumulada(unidad.getEdificio(), periodo);
    }

    @Transactional
    public void distribuirNuevoGastoExtra(Edificio edificio, Double monto, String descripcion, YearMonth periodo) {
        if (monto == null || monto <= 0) {
            return;
        }
        List<Unidad> unidadesOcupadas = unidadRepository.findByEdificioId(edificio.getId()).stream()
            .filter(u -> u.getInquilino() != null)
            .toList();

        if (unidadesOcupadas.isEmpty()) {
            return;
        }

        Integer cantidadDepts = edificio.getCantidadDepartamentos();
        int n = (cantidadDepts != null && cantidadDepts > 0) ? cantidadDepts : unidadesOcupadas.size();
        double parteBase = redondear(monto / n);
        List<Double> partes = new java.util.ArrayList<>();
        double sumaAsignada = 0.0;

        for (int i = 0; i < n; i++) {
            partes.add(parteBase);
            sumaAsignada = redondear(sumaAsignada + parteBase);
        }

        double diferencia = redondear(monto - sumaAsignada);
        if (Math.abs(diferencia) >= 0.01) {
            int last = partes.size() - 1;
            partes.set(last, redondear(partes.get(last) + diferencia));
        }

        for (int i = 0; i < unidadesOcupadas.size(); i++) {
            Unidad unidad = unidadesOcupadas.get(i);
            double parte = partes.get(i);
            if (parte <= 0) {
                continue;
            }

            Deuda deuda = new Deuda(
                unidad.getInquilino(),
                unidad,
                edificio,
                TipoDeuda.GASTOS_EXTRA,
                periodo.toString(),
                parte,
                (descripcion == null || descripcion.isBlank()) ? "Gasto extraordinario" : descripcion
            );
            deudaRepository.save(deuda);
        }
    }

    @Transactional
    public ResultadoAplicacion aplicarPago(Long inquilinoId, Long edificioId, Double monto) {
        if (monto == null || monto <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El monto debe ser mayor a 0");
        }

        List<Deuda> deudasAbiertas = deudaRepository
            .findByInquilinoIdAndEdificioIdAndEstadoInOrderByPeriodoAscCreadaEnAsc(inquilinoId, edificioId, ESTADOS_ABIERTOS);

        // Si no hay deudas, no lanzamos error, solo retornamos que no se aplicó nada
        if (deudasAbiertas.isEmpty()) {
            return new ResultadoAplicacion(0.0, 0.0, new ArrayList<>());
        }

        double totalPendienteOriginal = deudasAbiertas.stream().mapToDouble(d -> valor(d.getMontoPendiente())).sum();

        // ORDENAMIENTO: Antigüedad -> Tipo (Alquiler primero) -> Fecha creación
        deudasAbiertas.sort(Comparator
            .comparing(Deuda::getPeriodo)
            .thenComparing(d -> prioridadTipo(d.getTipo()))
            .thenComparing(Deuda::getCreadaEn));

        double restante = monto;
        List<AplicacionDetalle> detalles = new ArrayList<>();

        for (Deuda deuda : deudasAbiertas) {
            if (restante <= 0.00001) {
                break;
            }

            double pendiente = valor(deuda.getMontoPendiente());
            if (pendiente <= 0) {
                continue;
            }

            // Aplicamos lo que podemos (o el total de la deuda o lo que queda del pago)
            double aplicar = Math.min(restante, pendiente);
            deuda.registrarPago(aplicar);
            deudaRepository.save(deuda);
            restante = redondear(restante - aplicar);

            if (deuda.getTipo() == TipoDeuda.GASTOS_EXTRA) {
                descontarGastoExtraPendiente(deuda.getEdificio().getId(), aplicar);
            }

            detalles.add(new AplicacionDetalle(
                deuda.getId(),
                deuda.getTipo().name(),
                deuda.getPeriodo(),
                redondear(aplicar),
                redondear(valor(deuda.getMontoPendiente()))
            ));
        }

        // Calculamos cuánto queda debiendo el inquilino en total tras este pago
        double nuevaDeudaPendiente = redondear(Math.max(0, totalPendienteOriginal - (monto - restante)));
        
        return new ResultadoAplicacion(redondear(monto - restante), nuevaDeudaPendiente, detalles);
    }

    @Transactional(readOnly = true)
    public Double obtenerTotalPendiente(Long inquilinoId, Long edificioId) {
        return redondear(valor(deudaRepository.totalPendientePorInquilinoYEdificio(inquilinoId, edificioId, ESTADOS_ABIERTOS)));
    }

    @Transactional(readOnly = true)
    public List<Deuda> obtenerPendientesPorInquilino(Long inquilinoId) {
        return deudaRepository.findByInquilinoIdAndEstadoInOrderByPeriodoAscCreadaEnAsc(inquilinoId, ESTADOS_ABIERTOS);
    }

    @Transactional
    public void aplicarPagoPendiente(Contrato contrato) {
        if (contrato.getEstado() != Contrato.EstadoPago.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se pueden confirmar pagos pendientes");
        }

        ResultadoAplicacion resultado = aplicarPago(
            contrato.getInquilino().getId(),
            contrato.getUnidad().getEdificio().getId(),
            contrato.getMonto()
        );

        contrato.setEstado(Contrato.EstadoPago.PAGADO);
        contrato.setTipoAplicacion(resultado.deudaPendienteTotal() > 0
            ? Contrato.TipoAplicacion.PARCIAL
            : Contrato.TipoAplicacion.TOTAL);
        contrato.setSaldoPendienteTotal(resultado.deudaPendienteTotal());
        contrato.setDetalleAplicacion(formatearDetalle(resultado.detalles()));
    }

    private void asegurarDeudaMensualRodante(Unidad unidad, String periodo, TipoDeuda tipo, Double montoBase, String descripcionBase) {
        double montoBaseNormalizado = redondear(valor(montoBase));

        List<Deuda> deudasPreviasAbiertas = deudaRepository
            .findByUnidadIdAndTipoAndEstadoInAndPeriodoLessThanOrderByPeriodoAscCreadaEnAsc(
                unidad.getId(),
                tipo,
                ESTADOS_ABIERTOS,
                periodo
            );

        double saldoArrastrado = redondear(deudasPreviasAbiertas.stream()
            .mapToDouble(d -> valor(d.getMontoPendiente()))
            .sum());

        if (montoBaseNormalizado <= 0 && saldoArrastrado <= 0) {
            return;
        }

        Deuda deudaActual = deudaRepository.findByUnidadIdAndPeriodoAndTipo(unidad.getId(), periodo, tipo).orElse(null);
        double montoOriginalDeseado = redondear(montoBaseNormalizado + saldoArrastrado);

        if (deudaActual != null && saldoArrastrado <= 0) {
            return;
        }

        if (!deudasPreviasAbiertas.isEmpty()) {
            deudasPreviasAbiertas.forEach(deuda -> {
                deuda.setMontoPendiente(0.0);
                deuda.setEstado(Deuda.EstadoDeuda.ARRASTRADA);
                deudaRepository.save(deuda);
            });
        }

        if (deudaActual != null) {
            deudaActual.setMontoOriginal(montoOriginalDeseado);
            deudaActual.setMontoPendiente(redondear(Math.max(0.0, montoOriginalDeseado - valor(deudaActual.getMontoPagado()))));
            deudaActual.setEstado(deudaActual.getMontoPendiente() <= 0.00001
                ? Deuda.EstadoDeuda.CANCELADA
                : (valor(deudaActual.getMontoPagado()) > 0 ? Deuda.EstadoDeuda.PARCIAL : Deuda.EstadoDeuda.PENDIENTE));

            if (deudaActual.getDescripcion() == null || deudaActual.getDescripcion().isBlank()) {
                deudaActual.setDescripcion(descripcionBase);
            }
            deudaRepository.save(deudaActual);
            return;
        }

        String descripcion = saldoArrastrado > 0
            ? descripcionBase + " + saldo arrastrado"
            : descripcionBase;

        Deuda deuda = new Deuda(unidad.getInquilino(), unidad, unidad.getEdificio(), tipo, periodo, montoOriginalDeseado, descripcion);
        deudaRepository.save(deuda);
    }

    private void asegurarDeudaExtraAcumulada(Edificio edificio, YearMonth periodo) {
        double saldoExtras = valor(edificio.getGastosExtra());
        if (saldoExtras <= 0) {
            return;
        }

        boolean yaHayDeudaExtraAbierta = deudaRepository.existsByEdificioIdAndTipoAndEstadoIn(
            edificio.getId(),
            TipoDeuda.GASTOS_EXTRA,
            ESTADOS_ABIERTOS
        );

        if (yaHayDeudaExtraAbierta) {
            return;
        }

        distribuirNuevoGastoExtra(edificio, saldoExtras, "Saldo acumulado de gastos extraordinarios", periodo);
    }

    private void descontarGastoExtraPendiente(Long edificioId, Double montoAplicado) {
        Edificio edificio = edificioRepository.findById(edificioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Edificio no encontrado"));

        double actual = valor(edificio.getGastosExtra());
        double nuevo = redondear(Math.max(0.0, actual - valor(montoAplicado)));
        edificio.setGastosExtra(nuevo);
        edificioRepository.save(edificio);
    }

    private double porcentajeNormalizado(Double porcentajeRaw) {
        if (porcentajeRaw == null || porcentajeRaw <= 0) {
            return 0.0;
        }
        return porcentajeRaw > 1 ? porcentajeRaw / 100.0 : porcentajeRaw;
    }

    private int prioridadTipo(TipoDeuda tipo) {
        return switch (tipo) {
            case ALQUILER -> 1;
            case EXPENSAS_BASE -> 2;
            case GASTOS_EXTRA -> 3;
        };
    }

    private String formatearDetalle(List<AplicacionDetalle> detalles) {
        if (detalles.isEmpty()) {
            return null;
        }

        StringBuilder builder = new StringBuilder();
        for (AplicacionDetalle detalle : detalles) {
            if (builder.length() > 0) {
                builder.append(" | ");
            }
            builder.append(detalle.tipo())
                .append("(")
                .append(detalle.periodo())
                .append("):")
                .append(detalle.montoAplicado());
        }
        return builder.toString();
    }

    private double valor(Double number) {
        return number == null ? 0.0 : number;
    }

    private double redondear(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}