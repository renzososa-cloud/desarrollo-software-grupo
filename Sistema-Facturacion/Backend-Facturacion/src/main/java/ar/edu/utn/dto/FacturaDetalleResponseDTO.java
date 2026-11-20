package ar.edu.utn.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FacturaDetalleResponseDTO {
    private Long id;
    private Long articuloId;
    private String articuloCodigo;
    private String articuloDenominacion;
    private Long listaPrecioArticuloId;
    private Long listaPrecioId;
    private String listaPrecio;
    private String descripcion;
    private double cantidad;
    private double precioUnitario;
    private double porcentajeBonificacion;
    private double importeSubtotal;
}