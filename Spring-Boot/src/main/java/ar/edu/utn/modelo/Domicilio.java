package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

import jakarta.persistence.Table;

@Entity
@Table(name = "domicilio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Domicilio extends EntityId {
    @Column(length = 50, nullable = false)
    private String nombreCalle;
    @Column(length = 20, nullable = false)
    private String numeroCalle;

}