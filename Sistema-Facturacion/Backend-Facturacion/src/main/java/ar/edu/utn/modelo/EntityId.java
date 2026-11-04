package ar.edu.utn.modelo;

import lombok.*;
import jakarta.persistence.*;
import java.util.Date;
import java.util.List;
// Superclase base
@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public abstract class EntityId {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long id;
}