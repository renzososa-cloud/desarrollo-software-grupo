package ar.edu.utn.modelo;

import lombok.*;
import java.util.Date;
import jakarta.persistence.*;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true) // Agregado fundamental para la herencia con EntityId
public abstract class AuditoriaApp extends EntityId {

    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    protected Date fechaAlta;

    @Temporal(TemporalType.TIMESTAMP)
    protected Date fechaBaja;

    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    protected Date fechaModificacion;

    @ManyToOne
    @JoinColumn(nullable = false, name = "usuario_carga_id")
    protected Usuario usuarioCarga;

    @ManyToOne
    @JoinColumn(name = "usuario_baja_id")
    protected Usuario usuarioBaja;

    @ManyToOne
    @JoinColumn(name = "usuario_modificacion_id", nullable = false)
    protected Usuario usuarioModificacion;

}