package ar.edu.utn.modelo;

import lombok.*;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

import jakarta.persistence.Table;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Usuario extends EntityId {

    @Column(nullable = false, length = 20)
    private String usuario;

    @Column(nullable = false, length = 20)
    private String clave;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String apellido;

}
