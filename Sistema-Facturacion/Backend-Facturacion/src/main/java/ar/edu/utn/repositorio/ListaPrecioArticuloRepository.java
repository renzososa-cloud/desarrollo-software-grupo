package ar.edu.utn.repositorio;

import ar.edu.utn.modelo.ListaPrecioArticulo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ListaPrecioArticuloRepository extends JpaRepository<ListaPrecioArticulo, Long> {
}