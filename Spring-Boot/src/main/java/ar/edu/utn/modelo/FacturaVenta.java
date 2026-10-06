package ar.edu.utn.modelo;

import lombok.*;

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
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true, exclude = {"detalles"})
@ToString(exclude = {"detalles"})
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

    // Metodo helper para mantener sincronizadas ambas puntas de la relacion
    // bidireccional (requisito del punto 3: asociar los detalles a la cabecera
    // "asociandolos bidireccionalmente").
    public void addDetalle(FacturaVentaDetalle detalle) {
        detalles.add(detalle);
        detalle.setFactura(this);
    }
}