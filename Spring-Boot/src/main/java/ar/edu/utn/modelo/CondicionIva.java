package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "condicion_iva")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class CondicionIva extends AuditoriaApp {
    @Column(nullable = false, length = 10)
    private int codigoAfip;
    @Column(nullable = false, length = 50)
    private String denominacion;

}