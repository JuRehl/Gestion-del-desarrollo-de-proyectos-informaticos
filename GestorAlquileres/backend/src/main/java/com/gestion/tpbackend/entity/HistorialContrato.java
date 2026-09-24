package com.gestion.tpbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historial_contratos")
public class HistorialContrato {

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
    private Double montoAlquiler;

    @Column
    private String vencimientoContrato;

    @Column(nullable = false)
    private LocalDateTime fechaInicio;

    @Column
    private LocalDateTime fechaFin;

    public HistorialContrato() {}

    public HistorialContrato(Unidad unidad, Usuario inquilino, Double montoAlquiler, String vencimientoContrato, LocalDateTime fechaInicio) {
        this.unidad = unidad;
        this.inquilino = inquilino;
        this.montoAlquiler = montoAlquiler;
        this.vencimientoContrato = vencimientoContrato;
        this.fechaInicio = fechaInicio;
    }

    public Long getId() { return id; }

    public Unidad getUnidad() { return unidad; }
    public void setUnidad(Unidad unidad) { this.unidad = unidad; }

    public Usuario getInquilino() { return inquilino; }
    public void setInquilino(Usuario inquilino) { this.inquilino = inquilino; }

    public Double getMontoAlquiler() { return montoAlquiler; }
    public void setMontoAlquiler(Double montoAlquiler) { this.montoAlquiler = montoAlquiler; }

    public String getVencimientoContrato() { return vencimientoContrato; }
    public void setVencimientoContrato(String vencimientoContrato) { this.vencimientoContrato = vencimientoContrato; }

    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDateTime getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDateTime fechaFin) { this.fechaFin = fechaFin; }
}