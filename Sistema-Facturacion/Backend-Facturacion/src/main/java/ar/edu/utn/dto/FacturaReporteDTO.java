package ar.edu.utn.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FacturaReporteDTO {
    private Long id;
    private Long numeroFactura;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "America/Argentina/Buenos_Aires")
    private Date fechaEmision;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "America/Argentina/Buenos_Aires")
    private Date fechaCreacionInterna;

    private String clienteDenominacion;
    private String condicionIva;
    private String puntoVentaDescripcion;
    private String listaPrecioDescripcion;
    private Double importeTotal;
    private Long cantidadItems;
    private String estado;
    private String cae;
    private boolean eliminada;
}