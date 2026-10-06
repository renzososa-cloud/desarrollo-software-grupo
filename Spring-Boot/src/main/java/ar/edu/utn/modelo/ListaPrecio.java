package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "lista_precio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class ListaPrecio extends AuditoriaApp {
    @Column(nullable = false, length = 10)
    private String codigo;
    @Column(nullable = false, length = 100)
    private String denominacion;

}