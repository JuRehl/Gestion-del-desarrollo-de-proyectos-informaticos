package com.gestion.tpbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
public class Notificacion {

    public enum Canal { EMAIL, IN_APP }
    public enum Estado { PENDIENTE, ENVIADO, ERROR }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @JsonIgnoreProperties({"contrasena", "hibernateLazyInitializer", "handler"})
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unidad_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Unidad unidad;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "text")
    private String cuerpo;

    @Column(columnDefinition = "text")
    private String datosJson;

    @Column(nullable = false)
    private LocalDateTime creadoEn;

    @Column
    private LocalDateTime leidoEn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Canal canal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Estado estado;

    public Notificacion() {}

    public Notificacion(Usuario usuario, Unidad unidad, String titulo, String cuerpo, String datosJson, Canal canal) {
        this.usuario = usuario;
        this.unidad = unidad;
        this.titulo = titulo;
        this.cuerpo = cuerpo;
        this.datosJson = datosJson;
        this.creadoEn = LocalDateTime.now();
        this.canal = canal;
        this.estado = Estado.PENDIENTE;
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public Unidad getUnidad() { return unidad; }
    public String getTitulo() { return titulo; }
    public String getCuerpo() { return cuerpo; }
    public String getDatosJson() { return datosJson; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public LocalDateTime getLeidoEn() { return leidoEn; }
    public Canal getCanal() { return canal; }
    public Estado getEstado() { return estado; }

    public void setEstado(Estado estado) { this.estado = estado; }
    public void setLeidoEn(LocalDateTime leidoEn) { this.leidoEn = leidoEn; }
}
