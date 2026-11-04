package ar.edu.utn.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FacturaDetalleRequestDTO {
    // Recibe el ID en lugar de la entidad anidada
    private Long articuloId;
    private double cantidad;
    private double porcentajeBonificacion;
}