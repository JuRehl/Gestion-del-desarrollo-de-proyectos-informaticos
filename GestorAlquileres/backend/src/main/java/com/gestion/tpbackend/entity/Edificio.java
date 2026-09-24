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
import java.util.List;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;

@Entity
@Table(name = "edificios")
public class Edificio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(nullable = false, length = 200)
    private String direccion;

    @Column(name = "cantidad_departamentos", nullable = false)
    private Integer cantidadDepartamentos;

    @Column(name = "cantidad_inquilinos", nullable = false)
    private Integer cantidadInquilinos;

    @Column(name = "expensas_base", nullable = false)
    private Double expensasBase;

    @Column(name = "gastos_extra")
    private Double gastosExtra;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "propietario_id", nullable = false)
    @JsonIgnoreProperties({"edificios", "contrasena", "hibernateLazyInitializer", "handler"})
    private Usuario propietario;

    @OneToMany(mappedBy = "edificio", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("edificio")
    private List<Unidad> unidades = new java.util.ArrayList<>();

    public Edificio() {
    }

    public Edificio(String nombre, String direccion, Integer cantidadDepartamentos, Integer cantidadInquilinos, Double expensasBase, Usuario propietario) {
        this.nombre = nombre;
        this.direccion = direccion;
        this.cantidadDepartamentos = cantidadDepartamentos;
        this.cantidadInquilinos = cantidadInquilinos;
        this.expensasBase = expensasBase;
        this.propietario = propietario;
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

    public String getDireccion() {
        return direccion;
    }

    public List<Unidad> getUnidades() {
        return unidades;
    }

    public void setUnidades(List<Unidad> unidades) {
        this.unidades = unidades;
    }
    
    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public Integer getCantidadDepartamentos() {
        return cantidadDepartamentos;
    }

    public void setCantidadDepartamentos(Integer cantidadDepartamentos) {
        this.cantidadDepartamentos = cantidadDepartamentos;
    }

    public Integer getCantidadInquilinos() {
        return cantidadInquilinos;
    }

    public void setCantidadInquilinos(Integer cantidadInquilinos) {
        this.cantidadInquilinos = cantidadInquilinos;
    }

    public Double getExpensasBase() {
        return expensasBase;
    }

    public void setExpensasBase(Double expensasBase) {
        this.expensasBase = expensasBase;
    }

    public Double getGastosExtra() {
        return gastosExtra;
    }

    public void setGastosExtra(Double gastosExtra) {
        this.gastosExtra = gastosExtra;
    }

    public Usuario getPropietario() {
        return propietario;
    }

    public void setPropietario(Usuario propietario) {
        this.propietario = propietario;
    }
}
