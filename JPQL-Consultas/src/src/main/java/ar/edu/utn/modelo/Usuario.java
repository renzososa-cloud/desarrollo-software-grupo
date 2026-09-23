package ar.edu.utn.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

import jakarta.persistence.Table;

@Entity
@Table(name = "usuario")
public class Usuario extends EntityId {

    @Column(nullable = false, length = 20)
    private String usuario;

    @Column(nullable = false, length = 20)
    private String clave;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String apellido;


    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }

    public String getClave() { return clave; }
    public void setClave(String clave) { this.clave = clave; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

}
