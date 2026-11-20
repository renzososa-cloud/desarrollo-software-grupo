package ar.edu.utn.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticuloCatalogoDTO {
    private Long id;
    private Long articuloId;
    private String articuloCodigo;
    private String articuloNombre;
    private String rubroNombre;
    private String marcaNombre;
    private Double precioVenta;
    private Long listaPrecioId;
    private String listaPrecioCodigo;
    private String listaNombre;
}