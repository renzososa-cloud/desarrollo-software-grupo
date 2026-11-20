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
    private Long listaPrecioArticuloId;
    private double cantidad;
    private double porcentajeBonificacion;
}