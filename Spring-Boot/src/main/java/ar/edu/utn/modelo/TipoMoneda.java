package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "tipo_moneda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class TipoMoneda extends AuditoriaApp {
    @Column(nullable = false, length = 10)
    private String codigoAfip;
    @Column(nullable = false, length = 100)
    private String denominacion;
    @Column(nullable = false, length = 3)
    private String simbolo;

}