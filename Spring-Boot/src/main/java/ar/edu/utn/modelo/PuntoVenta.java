package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "punto_venta")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class PuntoVenta extends AuditoriaApp {
    @Column(nullable = false, length = 10)
    private int numero;
    @Column(nullable = false, length = 100)
    private String descripcion;
    @Column(nullable = false, length = 50)
    private String tipoEmision;
    @Column(nullable = false, length = 200)
    private String domicilioComercial;

}