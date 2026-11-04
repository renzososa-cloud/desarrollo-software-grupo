package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

// Entidad FacturaVenta refactorizada con Lombok
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

    private Long numero;

    @Column(nullable = false)
    @Temporal(TemporalType.DATE)
    private Date fechaEmision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "punto_venta_id", nullable = false)
    private PuntoVenta puntoVenta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = true) // Es true porque puede ser Consumidor Final
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "condicion_iva_id", nullable = false)
    private CondicionIva condicionIva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_moneda_id", nullable = false)
    private TipoMoneda tipoMoneda;

    private double importeCobrado;
    private double importeSaldo;

    @Column(nullable = false)
    private double importeTotal;
    private String cae;
    private Date caeFechaVencimiento;
    private String resultadoAfip;
    private String motivoRechazo;

    @Column(nullable = false)
    private String estado;

    private Date fechaAnulacion;
    private String observaciones;

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FacturaVentaDetalle> detalles;
}