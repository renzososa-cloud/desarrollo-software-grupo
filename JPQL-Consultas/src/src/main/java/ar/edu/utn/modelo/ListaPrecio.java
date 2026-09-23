package ar.edu.utn.modelo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "lista_precio")
public class ListaPrecio extends AuditoriaApp {
    @Column(nullable = false, length = 10)
    private String codigo;
    @Column(nullable = false, length = 100)
    private String denominacion;
    public ListaPrecio() {}
    
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

    
}