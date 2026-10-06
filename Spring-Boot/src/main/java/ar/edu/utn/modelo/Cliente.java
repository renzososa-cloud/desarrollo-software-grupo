package ar.edu.utn.modelo;

import lombok.*;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "cliente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Cliente extends AuditoriaApp {

    @Column(nullable = false, length = 20)
    private String cuitCuil;

    @Column(nullable = false, length = 50)
    private String denominacion;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(nullable = false, name = "contacto_id")
    private Contacto contacto;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(nullable = false, name = "domicilio_id")
    private Domicilio domicilio;

}