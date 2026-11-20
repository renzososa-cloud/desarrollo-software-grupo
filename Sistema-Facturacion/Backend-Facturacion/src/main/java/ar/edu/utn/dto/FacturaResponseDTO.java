package ar.edu.utn.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FacturaResponseDTO {
    private Long id;
    private Long numero;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "America/Argentina/Buenos_Aires")
    private Date fechaEmision;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "America/Argentina/Buenos_Aires")
    private Date fechaCreacionInterna;

    private Long puntoVentaId;
    private int puntoVentaNumero;
    private String puntoVentaDescripcion;
    private int tipoComprobante;

    private Long clienteId;
    private String clienteDenominacion;
    private String clienteCuitCuil;

    private Long listaPrecioId;
    private String listaPrecioCodigo;
    private String listaPrecio;

    private Long condicionIvaId;
    private String condicionIva;

    private Long tipoMonedaId;
    private String tipoMoneda;

    private String usuario;
    private String estado;
    private double importeCobrado;
    private double importeSaldo;
    private double importeTotal;
    private String observaciones;

    private String cae;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "America/Argentina/Buenos_Aires")
    private Date caeFechaVencimiento;

    private String resultadoAfip;
    private String motivoRechazo;

    private List<FacturaDetalleResponseDTO> detalles;
}