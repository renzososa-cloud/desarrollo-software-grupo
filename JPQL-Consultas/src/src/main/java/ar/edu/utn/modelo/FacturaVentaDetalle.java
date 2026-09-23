package ar.edu.utn.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "factura_venta_detalle")
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

    public FacturaVentaDetalle() {}

    public FacturaVenta getFactura() {
        return factura;
    }

    public void setFactura(FacturaVenta factura) {
        this.factura = factura;
    }

    public ListaPrecioArticulo getListaPrecioArticulo() {
        return listaPrecioArticulo;
    }

    public void setListaPrecioArticulo(ListaPrecioArticulo listaPrecioArticulo) {
        this.listaPrecioArticulo = listaPrecioArticulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public double getCantidad() {
        return cantidad;
    }

    public void setCantidad(double cantidad) {
        this.cantidad = cantidad;
    }

    public double getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(double precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public double getPorcentajeBonificacion() {
        return porcentajeBonificacion;
    }

    public void setPorcentajeBonificacion(double porcentajeBonificacion) {
        this.porcentajeBonificacion = porcentajeBonificacion;
    }

    public double getImporteNeto() {
        return importeNeto;
    }

    public void setImporteNeto(double importeNeto) {
        this.importeNeto = importeNeto;
    }

    public double getImporteIva() {
        return importeIva;
    }

    public void setImporteIva(double importeIva) {
        this.importeIva = importeIva;
    }

    public double getImporteSubtotal() {
        return importeSubtotal;
    }

    public void setImporteSubtotal(double importeSubtotal) {
        this.importeSubtotal = importeSubtotal;
    }
}