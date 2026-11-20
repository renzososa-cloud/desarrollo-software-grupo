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
            "(:tab = 'ELIMINADAS' AND (f.fechaBaja IS NOT NULL OR f.estado = 'ANULADA') OR " +
            " :tab = 'EMITIDA' AND f.fechaBaja IS NULL AND f.estado = 'EMITIDA' AND f.cae IS NOT NULL AND f.cae <> '' OR " +
            " (:tab IS NULL OR :tab = 'SIN_EMITIR') AND f.fechaBaja IS NULL AND f.estado <> 'ANULADA' AND (f.cae IS NULL OR f.cae = '')) AND " +
            "(:numero IS NULL OR f.numero = :numero) AND " +
            "(:fechaDesde IS NULL OR COALESCE(f.fechaEmision, f.fechaAlta) >= :fechaDesde) AND " +
            "(:fechaHasta IS NULL OR COALESCE(f.fechaEmision, f.fechaAlta) <= :fechaHasta) AND " +
            "(:montoMinimo IS NULL OR f.importeTotal >= :montoMinimo) AND " +
            "(:cliente IS NULL OR " +
            "  (c IS NOT NULL AND LOWER(c.denominacion) LIKE LOWER(CONCAT('%', :cliente, '%'))) OR " +
            "  (c IS NULL AND LOWER('Consumidor Final') LIKE LOWER(CONCAT('%', :cliente, '%'))))")
    Page<FacturaVenta> buscarConFiltros(
            @Param("tab") String tab,
            @Param("numero") Long numero,
            @Param("fechaDesde") Date fechaDesde,
            @Param("fechaHasta") Date fechaHasta,
            @Param("cliente") String cliente,
            @Param("montoMinimo") Double montoMinimo,
            Pageable pageable);
}