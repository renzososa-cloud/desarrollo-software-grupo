package ar.edu.utn.modelo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "factura_venta_detalle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class FacturaVentaDetalle extends EntityId {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factura_id", nullable = false)
    private FacturaVenta factura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lista_precio_articulo_id", nullable = false)
    private ListaPrecioArticulo listaPrecioArticulo;

    private String descripcion;

    @Column(nullable = false)
    private double cantidad;

    @Column(nullable = false)
    private double precioUnitario;

    private double porcentajeBonificacion;
    private double importeNeto;
    private double importeIva;

    @Column(nullable = false)
    private double importeSubtotal;
}