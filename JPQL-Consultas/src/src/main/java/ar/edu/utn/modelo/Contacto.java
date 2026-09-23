package ar.edu.utn.modelo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "contacto")
public class Contacto extends EntityId {
    @Column(length = 50, nullable = false)
    private String email;
    @Column(length = 20, nullable = false)
    private String telefono;
    @Column(length = 20)
    private String celular;
    public Contacto() {}

    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getTelefono() {
        return telefono;
    }
    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }
    public String getCelular() {
        return celular;
    }
    public void setCelular(String celular) {
        this.celular = celular;
    }

}