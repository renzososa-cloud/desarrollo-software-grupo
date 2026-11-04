package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "cliente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Cliente extends AuditoriaApp {

    @Column(nullable = false)
    private String cuitCuil;

    @Column(nullable = false)
    private String denominacion;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "contacto_id", nullable = false)
    private Contacto contacto;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "domicilio_id", nullable = false)
    private Domicilio domicilio;
}