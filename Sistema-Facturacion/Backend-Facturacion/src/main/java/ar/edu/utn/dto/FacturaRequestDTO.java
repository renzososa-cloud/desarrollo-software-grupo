package ar.edu.utn.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FacturaRequestDTO {

    // Forzamos la zona horaria de Argentina al recibir los datos del frontend
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "America/Argentina/Buenos_Aires")
    private Date fechaEmision;

    // Identificadores para vincular las relaciones
    private Long puntoVentaId;
    private Long clienteId; // Puede ser nulo si es consumidor final
    private Long condicionIvaId;
    private Long tipoMonedaId;

    private String observaciones;

    // Lista de ítems anidados
    private List<FacturaDetalleRequestDTO> detalles;
}