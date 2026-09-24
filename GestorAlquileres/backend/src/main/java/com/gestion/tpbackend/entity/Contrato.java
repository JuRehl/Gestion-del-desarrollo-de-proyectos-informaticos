package com.gestion.tpbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contratos")
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unidad_id", nullable = false)
    @JsonIgnoreProperties({"inquilino", "hibernateLazyInitializer", "handler"})
    private Unidad unidad;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inquilino_id", nullable = false)
    @JsonIgnoreProperties({"edificios", "contrasena", "hibernateLazyInitializer", "handler"})
    private Usuario inquilino;

    @Column(nullable = false)
    private Double monto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MetodoPago metodo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPago estado;

    @Column(length = 500)
    private String nota;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_aplicacion", nullable = false, length = 20)
    private TipoAplicacion tipoAplicacion;

    @Column(name = "saldo_pendiente_total")
    private Double saldoPendienteTotal;

    @Column(name = "detalle_aplicacion", length = 1000)
    private String detalleAplicacion;

    public enum MetodoPago { TARJETA, EFECTIVO }
    public enum EstadoPago { PAGADO, PENDIENTE }
    public enum TipoAplicacion { SIN_APLICAR, PARCIAL, TOTAL }

    public Contrato() {}

    public Contrato(Unidad unidad, Usuario inquilino, Double monto, MetodoPago metodo, EstadoPago estado, String nota) {
        this.unidad = unidad;
        this.inquilino = inquilino;
        this.monto = monto;
        this.metodo = metodo;
        this.estado = estado;
        this.nota = nota;
        this.fechaPago = LocalDateTime.now();
        this.tipoAplicacion = TipoAplicacion.SIN_APLICAR;
        this.saldoPendienteTotal = null;
        this.detalleAplicacion = null;
    }

    public Long getId() { return id; }

    public Unidad getUnidad() { return unidad; }
    public void setUnidad(Unidad unidad) { this.unidad = unidad; }

    public Usuario getInquilino() { return inquilino; }
    public void setInquilino(Usuario inquilino) { this.inquilino = inquilino; }

    public Double getMonto() { return monto; }
    public void setMonto(Double monto) { this.monto = monto; }

    public MetodoPago getMetodo() { return metodo; }
    public void setMetodo(MetodoPago metodo) { this.metodo = metodo; }

    public EstadoPago getEstado() { return estado; }
    public void setEstado(EstadoPago estado) { this.estado = estado; }

    public String getNota() { return nota; }
    public void setNota(String nota) { this.nota = nota; }

    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }

    public TipoAplicacion getTipoAplicacion() { return tipoAplicacion; }
    public void setTipoAplicacion(TipoAplicacion tipoAplicacion) { this.tipoAplicacion = tipoAplicacion; }

    public Double getSaldoPendienteTotal() { return saldoPendienteTotal; }
    public void setSaldoPendienteTotal(Double saldoPendienteTotal) { this.saldoPendienteTotal = saldoPendienteTotal; }

    public String getDetalleAplicacion() { return detalleAplicacion; }
    public void setDetalleAplicacion(String detalleAplicacion) { this.detalleAplicacion = detalleAplicacion; }
}