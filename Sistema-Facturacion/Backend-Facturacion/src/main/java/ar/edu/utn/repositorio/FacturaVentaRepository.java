package ar.edu.utn.repositorio;

import ar.edu.utn.modelo.FacturaVenta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;

@Repository
public interface FacturaVentaRepository extends JpaRepository<FacturaVenta, Long> {

    @Query("SELECT f FROM FacturaVenta f LEFT JOIN f.cliente c WHERE " +
            "(:numero IS NULL OR f.numero = :numero) AND " +
            "(:fechaDesde IS NULL OR f.fechaEmision >= :fechaDesde) AND " +
            "(:fechaHasta IS NULL OR f.fechaEmision <= :fechaHasta) AND " +
            "(:cliente IS NULL OR LOWER(c.denominacion) LIKE LOWER(CONCAT('%', :cliente, '%'))) AND " +
            "(:informadaArca IS NULL OR " +
            "  (:informadaArca = true AND f.cae IS NOT NULL AND f.cae != '') OR " +
            "  (:informadaArca = false AND (f.cae IS NULL OR f.cae = ''))" +
            ")")
    Page<FacturaVenta> buscarConFiltros(
            @Param("numero") Long numero,
            @Param("fechaDesde") Date fechaDesde,
            @Param("fechaHasta") Date fechaHasta,
            @Param("cliente") String cliente,
            @Param("informadaArca") Boolean informadaArca,
            Pageable pageable);
}