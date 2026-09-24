package com.gestion.tpbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "deudas")
public class Deuda {

    public enum TipoDeuda {
        ALQUILER,
        EXPENSAS_BASE,
        GASTOS_EXTRA
    }

    public enum EstadoDeuda {
        PENDIENTE,
        PARCIAL,
        ARRASTRADA,
        CANCELADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inquilino_id", nullable = false)
    @JsonIgnoreProperties({"edificios", "contrasena", "hibernateLazyInitializer", "handler"})
    private Usuario inquilino;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unidad_id", nullable = false)
    @JsonIgnoreProperties({"inquilino", "hibernateLazyInitializer", "handler"})
    private Unidad unidad;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "edificio_id", nullable = false)
    @JsonIgnoreProperties({"unidades", "propietario", "hibernateLazyInitializer", "handler"})
    private Edificio edificio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoDeuda tipo;

    @Column(nullable = false, length = 7)
    private String periodo;

    @Column(nullable = false)
    private Double montoOriginal;

    @Column(nullable = false)
    private Double montoPagado;

    @Column(nullable = false)
    private Double montoPendiente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoDeuda estado;

    @Column(length = 250)
    private String descripcion;

    @Column(name = "creada_en", nullable = false)
    private LocalDateTime creadaEn;

    @Column(name = "actualizada_en", nullable = false)
    private LocalDateTime actualizadaEn;

    public Deuda() {
    }

    public Deuda(
        Usuario inquilino,
        Unidad unidad,
        Edificio edificio,
        TipoDeuda tipo,
        String periodo,
        Double montoOriginal,
        String descripcion
    ) {
        this.inquilino = inquilino;
        this.unidad = unidad;
        this.edificio = edificio;
        this.tipo = tipo;
        this.periodo = periodo;
        this.montoOriginal = montoOriginal;
        this.montoPagado = 0.0;
        this.montoPendiente = montoOriginal;
        this.estado = EstadoDeuda.PENDIENTE;
        this.descripcion = descripcion;
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.creadaEn = now;
        this.actualizadaEn = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.actualizadaEn = LocalDateTime.now();
    }

    public void registrarPago(Double monto) {
        if (monto == null || monto <= 0) {
            return;
        }

        this.montoPagado += monto;
        this.montoPendiente = Math.max(0.0, this.montoOriginal - this.montoPagado);

        if (this.montoPendiente <= 0.00001) {
            this.montoPendiente = 0.0;
            this.estado = EstadoDeuda.CANCELADA;
        } else if (this.montoPagado > 0) {
            this.estado = EstadoDeuda.PARCIAL;
        } else {
            this.estado = EstadoDeuda.PENDIENTE;
        }
    }

    public Long getId() {
        return id;
    }

    public Usuario getInquilino() {
        return inquilino;
    }

    public void setInquilino(Usuario inquilino) {
        this.inquilino = inquilino;
    }

    public Unidad getUnidad() {
        return unidad;
    }

    public void setUnidad(Unidad unidad) {
        this.unidad = unidad;
    }

    public Edificio getEdificio() {
        return edificio;
    }

    public void setEdificio(Edificio edificio) {
        this.edificio = edificio;
    }

    public TipoDeuda getTipo() {
        return tipo;
    }

    public void setTipo(TipoDeuda tipo) {
        this.tipo = tipo;
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    public Double getMontoOriginal() {
        return montoOriginal;
    }

    public void setMontoOriginal(Double montoOriginal) {
        this.montoOriginal = montoOriginal;
    }

    public Double getMontoPagado() {
        return montoPagado;
    }

    public void setMontoPagado(Double montoPagado) {
        this.montoPagado = montoPagado;
    }

    public Double getMontoPendiente() {
        return montoPendiente;
    }

    public void setMontoPendiente(Double montoPendiente) {
        this.montoPendiente = montoPendiente;
    }

    public EstadoDeuda getEstado() {
        return estado;
    }

    public void setEstado(EstadoDeuda estado) {
        this.estado = estado;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public LocalDateTime getCreadaEn() {
        return creadaEn;
    }

    public void setCreadaEn(LocalDateTime creadaEn) {
        this.creadaEn = creadaEn;
    }

    public LocalDateTime getActualizadaEn() {
        return actualizadaEn;
    }

    public void setActualizadaEn(LocalDateTime actualizadaEn) {
        this.actualizadaEn = actualizadaEn;
    }
}
