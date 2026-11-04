package ar.edu.utn.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticuloCatalogoDTO {
    private Long id; // El ID de lista_precio_articulo (del 1 al 12)
    private String articuloNombre; // Ej: "Arroz Blanco 1kg"
    private Double precioVenta; // Ej: 1500.0
    private String listaNombre; // Ej: "Lista Minorista" o "Lista Mayorista"
}