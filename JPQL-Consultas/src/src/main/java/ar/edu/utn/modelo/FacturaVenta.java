package ar.edu.utn.modelo;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "factura_venta")
public class FacturaVenta extends AuditoriaApp {

    @Column(nullable = false)
    private Long numero;

    @Column(nullable = false)
    @Temporal(TemporalType.DATE)
    private Date fechaEmision;

    @ManyToOne
    @JoinColumn(nullable = false, name = "punto_venta_id")
    private PuntoVenta puntoVenta;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;
    @ManyToOne
    @JoinColumn(nullable = false, name = "moneda_id")
    private TipoMoneda moneda;
    @ManyToOne
    @JoinColumn(nullable = false, name = "condicion_iva_id")
    private CondicionIva condicionIva;

    @Column(nullable = false)
    private double importeCobrado;
    @Column(nullable = false)
    private double importeSaldo;

    @Column(nullable = false)
    private double importeTotal;

    @Column(length = 50)
    private String cae;

    @Temporal(TemporalType.DATE)
    private Date caeFechaVencimiento;

    @Column(length = 50)
    private String resultadoAfip;
    @Column(length = 2000)
    private String motivoRechazo;

    @Column(nullable = false)
    private String estado;

    @Temporal(TemporalType.DATE)
    private Date fechaAnulacion;

    @Column(length = 2000)
    private String observaciones;

    // mappedBy = "factura" -> debe coincidir con el nombre del campo en FacturaVentaDetalle
    // cascade = ALL -> al persistir la FacturaVenta, Hibernate persiste automaticamente
    // (o actualiza/borra) todos los detalles de esta lista. Por eso en Main.java
    // alcanza con un unico em.persist(facturaVenta).
    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FacturaVentaDetalle> detalles = new ArrayList<>();

    public FacturaVenta() {}

    public Long getNumero() {
        return numero;
    }

    public void setNumero(Long numero) {
        this.numero = numero;
    }

    public Date getFechaEmision() {
        return fechaEmision;
    }

    public void setFechaEmision(Date fechaEmision) {
        this.fechaEmision = fechaEmision;
    }

    public PuntoVenta getPuntoVenta() {
        return puntoVenta;
    }

    public void setPuntoVenta(PuntoVenta puntoVenta) {
        this.puntoVenta = puntoVenta;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }
    public Cliente getCliente() {
        return cliente;
    }

    public void setMoneda(TipoMoneda moneda) {
        this.moneda = moneda;
    }
    public TipoMoneda getMoneda() {
        return moneda;
    }

    public void setCondicionIva(CondicionIva condicionIva) {
        this.condicionIva = condicionIva;
    }
    public CondicionIva getCondicionIva() {
        return condicionIva;
    }


    public double getImporteCobrado() {
        return importeCobrado;
    }

    public void setImporteCobrado(double importeCobrado) {
        this.importeCobrado = importeCobrado;
    }

    public double getImporteSaldo() {
        return importeSaldo;
    }

    public void setImporteSaldo(double importeSaldo) {
        this.importeSaldo = importeSaldo;
    }

    public double getImporteTotal() {
        return importeTotal;
    }

    public void setImporteTotal(double importeTotal) {
        this.importeTotal = importeTotal;
    }

    public String getCae() {
        return cae;
    }

    public void setCae(String cae) {
        this.cae = cae;
    }

    public Date getCaeFechaVencimiento() {
        return caeFechaVencimiento;
    }

    public void setCaeFechaVencimiento(Date caeFechaVencimiento) {
        this.caeFechaVencimiento = caeFechaVencimiento;
    }

    public String getResultadoAfip() {
        return resultadoAfip;
    }

    public void setResultadoAfip(String resultadoAfip) {
        this.resultadoAfip = resultadoAfip;
    }

    public String getMotivoRechazo() {
        return motivoRechazo;
    }

    public void setMotivoRechazo(String motivoRechazo) {
        this.motivoRechazo = motivoRechazo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Date getFechaAnulacion() {
        return fechaAnulacion;
    }

    public void setFechaAnulacion(Date fechaAnulacion) {
        this.fechaAnulacion = fechaAnulacion;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public List<FacturaVentaDetalle> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<FacturaVentaDetalle> detalles) {
        this.detalles = detalles;
    }

    // Metodo helper para mantener sincronizadas ambas puntas de la relacion
    // bidireccional (requisito del punto 3: asociar los detalles a la cabecera
    // "asociandolos bidireccionalmente").
    public void addDetalle(FacturaVentaDetalle detalle) {
        detalles.add(detalle);
        detalle.setFactura(this);
    }
}