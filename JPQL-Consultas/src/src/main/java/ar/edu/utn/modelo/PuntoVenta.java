package ar.edu.utn.modelo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "punto_venta")
public class PuntoVenta extends AuditoriaApp {
    @Column(nullable = false, length = 10)
    private int numero;
    @Column(nullable = false, length = 100)
    private String descripcion;
    @Column(nullable = false, length = 50)
    private String tipoEmision;
    @Column(nullable = false, length = 200)
    private String domicilioComercial;
    public PuntoVenta() {}
    
    public int getNumero() {
        return numero;
    }
    public void setNumero(int numero) {
        this.numero = numero;
    }
    public String getDescripcion() {
        return descripcion;
    }
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
    public String getTipoEmision() {
        return tipoEmision;
    }
    public void setTipoEmision(String tipoEmision) {
        this.tipoEmision = tipoEmision;
    }
    public String getDomicilioComercial() {
        return domicilioComercial;
    }
    public void setDomicilioComercial(String domicilioComercial) {
        this.domicilioComercial = domicilioComercial;
    }

    
}