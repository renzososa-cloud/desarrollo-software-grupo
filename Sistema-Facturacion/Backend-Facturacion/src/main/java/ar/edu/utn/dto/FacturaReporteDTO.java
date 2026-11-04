package ar.edu.utn.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FacturaReporteDTO {
    private Long id; // AGREGADO: ID real para poder eliminar
    private Long numeroFactura;

    // Forzamos la zona horaria de Argentina al enviar los datos al frontend
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "America/Argentina/Buenos_Aires")
    private Date fechaEmision;

    private String clienteDenominacion;
    private String condicionIva;
    private String puntoVentaDescripcion;
    private Double importeTotal;
    private Long cantidadItems;
    private String estado; // NUEVO: Para saber si está EMITIDA o ANULADA
    private String cae; // NUEVO: Para identificar si fue enviada a ARCA
}
