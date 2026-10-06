package ar.edu.utn.modelo;

import lombok.*;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "factura_venta_detalle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class FacturaVentaDetalle extends EntityId {

    @ManyToOne
    @JoinColumn(nullable = false, name = "factura_id")
    private FacturaVenta factura;

    @ManyToOne
    @JoinColumn(nullable = false, name = "lista_precio_articulo_id")
    private ListaPrecioArticulo listaPrecioArticulo;

    @Column(length = 100)
    private String descripcion;

    @Column(nullable = false)
    private double cantidad;
    @Column(nullable = false)
    private double precioUnitario;
    @Column(nullable = false)
    private double porcentajeBonificacion;
    @Column(nullable = false)
    private double importeNeto;
    @Column(nullable = false)
    private double importeIva;
    @Column(nullable = false)
    private double importeSubtotal;

}