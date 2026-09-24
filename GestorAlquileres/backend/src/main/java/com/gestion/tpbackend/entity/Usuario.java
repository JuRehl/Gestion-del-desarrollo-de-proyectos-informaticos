package com.gestion.tpbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RolUsuario rol;

    @Column(name = "contrasena", nullable = false, length = 255)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String contrasena;

    @Column(nullable = false)
    private boolean activo = true; 

    @Column(name = "fecha_fin_contrato")
    private LocalDateTime fechaFinContrato;

    @OneToMany(mappedBy = "propietario")
    @JsonIgnore
    private List<Edificio> edificios = new ArrayList<>();

    @Transient
    private String claveSecreta;

    public Usuario() {
    }

    public Usuario(String nombre, String email, RolUsuario rol, String contrasena) {
        this.nombre = nombre;
        this.email = email;
        this.rol = rol;
        this.contrasena = contrasena;
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public RolUsuario getRol() {
        return rol;
    }

    public void setRol(RolUsuario rol) {
        this.rol = rol;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }

    public List<Edificio> getEdificios() {
        return edificios;
    }

    public void setEdificios(List<Edificio> edificios) {
        this.edificios = edificios;
    }

    public String getClaveSecreta() {
        return claveSecreta;
    }

    public void setClaveSecreta(String claveSecreta) {
        this.claveSecreta = claveSecreta;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public LocalDateTime getFechaFinContrato() {
        return fechaFinContrato;
    }

    public void setFechaFinContrato(LocalDateTime fechaFinContrato) {
        this.fechaFinContrato = fechaFinContrato;
    }
}
