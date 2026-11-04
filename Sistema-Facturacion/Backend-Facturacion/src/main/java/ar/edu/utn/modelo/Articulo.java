package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "articulo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Articulo extends AuditoriaApp {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rubro_id")
    private Rubro rubro;

    @Column(nullable = false)
    private String codigo;

    @Column(nullable = false)
    private String denominacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marca_id")
    private Marca marca;
}