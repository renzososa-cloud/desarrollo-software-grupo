package ar.edu.utn.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "articulo")
public class Articulo extends AuditoriaApp {
    @ManyToOne
    @JoinColumn(nullable = false, name = "rubro_id")
    private Rubro rubro;
    
    @Column(nullable = false, length = 10)
    private String codigo;
    
    @Column(nullable = false, length = 50)
    private String denominacion;
    
    @ManyToOne
    @JoinColumn(nullable = false, name = "marca_id")
    private Marca marca;
    
    public Articulo() {}

    public Rubro getRubro() {
        return rubro;
    }

    public void setRubro(Rubro rubro) {
        this.rubro = rubro;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDenominacion() {
        return denominacion;
    }

    public void setDenominacion(String denominacion) {
        this.denominacion = denominacion;
    }

    public Marca getMarca() {
        return marca;
    }

    public void setMarca(Marca marca) {
        this.marca = marca;
    }

    

    
}