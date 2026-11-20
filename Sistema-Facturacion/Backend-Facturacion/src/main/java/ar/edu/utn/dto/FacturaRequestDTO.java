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
public class FacturaRequestDTO {

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "America/Argentina/Buenos_Aires")
    private Date fechaEmision;

    private Long puntoVentaId;
    private Long clienteId;
    private Long listaPrecioId;
    private Long condicionIvaId;
    private Long tipoMonedaId;
    private String observaciones;
    private List<FacturaDetalleRequestDTO> detalles;
}