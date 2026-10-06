package ar.edu.utn.modelo;

import lombok.*;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "articulo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Articulo extends AuditoriaApp {
    @ManyToOne
    @JoinColumn(nullable = false, name = "rubro_id")
    private Rubro rubro;

    @Column(nullable = false, length = 10)
    private String codigo;

    @Column(nullable = false, length = 50)
    private String denominacion;

    @ManyToOne
    @JoinColumn(nullable = false, name = "marca_id")
    private Marca marca;

}