package ar.edu.utn.repositorio;

import ar.edu.utn.modelo.CondicionIva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CondicionIvaRepository extends JpaRepository<CondicionIva, Long> {
}