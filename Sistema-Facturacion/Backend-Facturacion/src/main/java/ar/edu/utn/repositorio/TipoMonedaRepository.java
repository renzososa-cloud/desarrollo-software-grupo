package ar.edu.utn.repositorio;

import ar.edu.utn.modelo.TipoMoneda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoMonedaRepository extends JpaRepository<TipoMoneda, Long> {
}