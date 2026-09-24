package com.gestion.tpbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "gastos")
public class Gasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "edificio_id", nullable = false)
    @JsonIgnoreProperties({"unidades", "propietario", "hibernateLazyInitializer", "handler"})
    private Edificio edificio;

    @Column(nullable = false, length = 120)
    private String tipo;

    @Column(nullable = false)
    private Double monto;

    @Column(length = 300)
    private String descripcion;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(name = "comprobante_original", nullable = false, length = 260)
    private String comprobanteOriginal;

    @Column(name = "comprobante_path", nullable = false, length = 400)
    private String comprobantePath;

    @Column(name = "comprobante_content_type", nullable = false, length = 120)
    private String comprobanteContentType;

    public Long getId() {
        return id;
    }

    public Edificio getEdificio() {
        return edificio;
    }

    public void setEdificio(Edificio edificio) {
        this.edificio = edificio;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Double getMonto() {
        return monto;
    }

    public void setMonto(Double monto) {
        this.monto = monto;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getComprobanteOriginal() {
        return comprobanteOriginal;
    }

    public void setComprobanteOriginal(String comprobanteOriginal) {
        this.comprobanteOriginal = comprobanteOriginal;
    }

    public String getComprobantePath() {
        return comprobantePath;
    }

    public void setComprobantePath(String comprobantePath) {
        this.comprobantePath = comprobantePath;
    }

    public String getComprobanteContentType() {
        return comprobanteContentType;
    }

    public void setComprobanteContentType(String comprobanteContentType) {
        this.comprobanteContentType = comprobanteContentType;
    }
}