package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "lista_precio_articulo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class ListaPrecioArticulo extends AuditoriaApp {
    @ManyToOne
    @JoinColumn(nullable = false, name = "lista_precio_id")
    private ListaPrecio listaPrecio;

    @Column(nullable = false)
    private double precioVenta;

    @ManyToOne
    @JoinColumn(nullable = false, name = "articulo_id")
    private Articulo articulo;

}