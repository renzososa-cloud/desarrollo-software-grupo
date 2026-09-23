package ar.edu.utn.modelo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

import jakarta.persistence.Table;

@Entity
@Table(name = "domicilio")
public class Domicilio extends EntityId {
    @Column(length = 50, nullable = false)
    private String nombreCalle;
    @Column(length = 20, nullable = false)
    private String numeroCalle;

    public Domicilio() {}

    public String getNombreCalle() {
        return nombreCalle;
    }
    public void setNombreCalle(String nombreCalle) {
        this.nombreCalle = nombreCalle;
    }
    public String getNumeroCalle() {
        return numeroCalle;
    }
    public void setNumeroCalle(String numeroCalle) {
        this.numeroCalle = numeroCalle;
    }

}