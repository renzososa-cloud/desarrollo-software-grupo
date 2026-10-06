package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "contacto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Contacto extends EntityId {
    @Column(length = 50, nullable = false)
    private String email;
    @Column(length = 20, nullable = false)
    private String telefono;
    @Column(length = 20)
    private String celular;

}