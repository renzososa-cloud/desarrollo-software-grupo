package ar.edu.utn.modelo;

import lombok.*;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;

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