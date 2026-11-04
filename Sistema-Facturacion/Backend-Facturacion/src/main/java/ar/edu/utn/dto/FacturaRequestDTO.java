package ar.edu.utn.dto;

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