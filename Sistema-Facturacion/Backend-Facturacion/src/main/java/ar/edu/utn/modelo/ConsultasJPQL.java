package ar.edu.utn.modelo;

import ar.edu.utn.modelo.*;
import jakarta.persistence.EntityManager;
import java.util.Date;
import java.util.List;

public class ConsultasJPQL {

    private final EntityManager em;

    public ConsultasJPQL(EntityManager em) {
        this.em = em;
    }

    // =========================================================================
    // Nivel 1: Consultas Básicas y Proyecciones
    // =========================================================================

    // 1. Consulta de Entidades Completas
    public List<FacturaVenta> ejercicio01_todasLasFacturas() {
        String jpql = "SELECT f FROM FacturaVenta f";
        return em.createQuery(jpql, FacturaVenta.class).getResultList();
    }

    // 2. Proyección de Atributos Específicos
    public List<Object[]> ejercicio02_proyeccionFacturas() {
        String jpql = "SELECT f.numero, f.fechaEmision, f.importeTotal FROM FacturaVenta f";
        return em.createQuery(jpql, Object[].class).getResultList();
    }

    // 3. Filtrado por Igualdad (WHERE)
    public List<Articulo> ejercicio03_articulosPorRubro(String denominacionRubro) {
        String jpql = "SELECT a FROM Articulo a WHERE a.rubro.denominacion = :denominacionRubro";
        return em.createQuery(jpql, Articulo.class)
                .setParameter("denominacionRubro", denominacionRubro)
                .getResultList();
    }

    // 4. Filtrado por Rango de Fechas (BETWEEN)
    public List<FacturaVenta> ejercicio04_facturasPorRangoFechas(Date fechaInicio, Date fechaFin) {
        String jpql = "SELECT f FROM FacturaVenta f WHERE f.fechaEmision BETWEEN :fechaInicio AND :fechaFin";
        return em.createQuery(jpql, FacturaVenta.class)
                .setParameter("fechaInicio", fechaInicio)
                .setParameter("fechaFin", fechaFin)
                .getResultList();
    }

    // =========================================================================
    // Nivel 2: Condicionales Combinados, Operadores de Texto y Agregaciones Básicas
    // =========================================================================

    // 5. Condicionales Complejos y Verificación de Nulos (AND, OR, IS NULL)
    public List<FacturaVenta> ejercicio05_facturasEmitidasSinAnular() {
        String jpql = "SELECT f FROM FacturaVenta f " +
                "WHERE f.estado = 'EMITIDA' " +
                "  AND f.importeTotal > 10000 " +
                "  AND f.fechaAnulacion IS NULL";
        return em.createQuery(jpql, FacturaVenta.class).getResultList();
    }

    // 6. Búsqueda por Patrón de Texto (LIKE y LOWER)
    public List<Cliente> ejercicio06_buscarClientesPorNombreOCuit(String textoParcial) {
        String jpql = "SELECT c FROM Cliente c " +
                "WHERE LOWER(c.denominacion) LIKE :patron " +
                "   OR c.cuitCuil LIKE '20-%'";
        return em.createQuery(jpql, Cliente.class)
                .setParameter("patron", "%" + textoParcial.toLowerCase() + "%")
                .getResultList();
    }

    // 7. Valores Distintos y Ordenamiento (DISTINCT y ORDER BY)
    public List<String> ejercicio07_estadosDistintos() {
        String jpql = "SELECT DISTINCT f.estado FROM FacturaVenta f ORDER BY f.estado ASC";
        return em.createQuery(jpql, String.class).getResultList();
    }

    // 8. Funciones de Agregación Simples (COUNT, SUM, AVG)
    public Object[] ejercicio08_agregacionesFacturas() {
        String jpql = "SELECT COUNT(f), SUM(f.importeTotal), AVG(f.importeTotal) " +
                "FROM FacturaVenta f WHERE f.estado = 'EMITIDA'";
        return em.createQuery(jpql, Object[].class).getSingleResult();
    }

    // 9. Operador de Inclusión (IN)
    public List<PuntoVenta> ejercicio09_puntosVentaPorNumeros(List<Integer> numeros) {
        String jpql = "SELECT pv FROM PuntoVenta pv WHERE pv.numero IN :numeros";
        return em.createQuery(jpql, PuntoVenta.class)
                .setParameter("numeros", numeros)
                .getResultList();
    }

    // =========================================================================
    // Nivel 3: Navegación de Entidades, JOINs y Subconsultas Simples
    // =========================================================================

    // 10. Navegación Implícita por Relaciones (Path Expressions)
    public List<FacturaVenta> ejercicio10_facturasPorUsuarioCarga(String nombreUsuario) {
        String jpql = "SELECT f FROM FacturaVenta f WHERE f.usuarioCarga.usuario = :nombreUsuario";
        return em.createQuery(jpql, FacturaVenta.class)
                .setParameter("nombreUsuario", nombreUsuario)
                .getResultList();
    }

    // 11. Cláusula INNER JOIN Explícita
    public List<FacturaVentaDetalle> ejercicio11_detallesPorPuntoVenta(int numeroPuntoVenta) {
        String jpql = "SELECT d FROM FacturaVentaDetalle d " +
                "INNER JOIN d.factura f " +
                "WHERE f.puntoVenta.numero = :numeroPuntoVenta";
        return em.createQuery(jpql, FacturaVentaDetalle.class)
                .setParameter("numeroPuntoVenta", numeroPuntoVenta)
                .getResultList();
    }

    // 12. Cláusula LEFT JOIN (Inclusión de Nulos)
    public List<Object[]> ejercicio12_articulosConMarcaOpcional() {
        String jpql = "SELECT a.denominacion, m.denominacion " +
                "FROM Articulo a " +
                "LEFT JOIN a.marca m";
        return em.createQuery(jpql, Object[].class).getResultList();
    }

    // 13. Navegación Multinivel con JOINs Combinados
    public List<FacturaVenta> ejercicio13_facturasPorMarcaArticulo(String nombreMarca) {
        String jpql = "SELECT DISTINCT f FROM FacturaVenta f " +
                "JOIN f.detalles d " +
                "JOIN d.listaPrecioArticulo lpa " +
                "JOIN lpa.articulo a " +
                "JOIN a.marca m " +
                "WHERE m.denominacion = :nombreMarca";
        return em.createQuery(jpql, FacturaVenta.class)
                .setParameter("nombreMarca", nombreMarca)
                .getResultList();
    }

    // 14. Subconsulta en Cláusula WHERE
    public List<FacturaVenta> ejercicio14_facturasMayorAlPromedio() {
        String jpql = "SELECT f FROM FacturaVenta f " +
                "WHERE f.importeTotal > (SELECT AVG(f2.importeTotal) FROM FacturaVenta f2)";
        return em.createQuery(jpql, FacturaVenta.class).getResultList();
    }

    // =========================================================================
    // Nivel 4: Agrupamiento (GROUP BY) y Filtros de Grupo (HAVING)
    // =========================================================================

    // 15. Agrupamiento Básico (GROUP BY)
    public List<Object[]> ejercicio15_facturacionPorPuntoVenta() {
        String jpql = "SELECT pv.descripcion, COUNT(f), SUM(f.importeTotal) " +
                "FROM FacturaVenta f " +
                "JOIN f.puntoVenta pv " +
                "GROUP BY pv.id, pv.descripcion";
        return em.createQuery(jpql, Object[].class).getResultList();
    }

    // 16. Agrupamiento con Condicional de Grupo (HAVING)
    public List<String> ejercicio16_usuariosConMasDeCincoFacturas() {
        String jpql = "SELECT u.nombre " +
                "FROM FacturaVenta f " +
                "JOIN f.usuarioCarga u " +
                "GROUP BY u.id, u.nombre " +
                "HAVING COUNT(f) > 5";
        return em.createQuery(jpql, String.class).getResultList();
    }

    // 17. Agrupamiento y Agregación sobre Entidades Relacionadas
    public List<Object[]> ejercicio17_ventasPorMarca() {
        String jpql = "SELECT m.denominacion, SUM(d.cantidad), SUM(d.importeSubtotal) " +
                "FROM FacturaVentaDetalle d " +
                "JOIN d.listaPrecioArticulo lpa " +
                "JOIN lpa.articulo a " +
                "JOIN a.marca m " +
                "GROUP BY m.id, m.denominacion";
        return em.createQuery(jpql, Object[].class).getResultList();
    }

    // =========================================================================
    // Nivel 5: Subconsultas Correlacionadas, EXISTS, NOT EXISTS y CASE WHEN
    // =========================================================================

    // 18. Subconsulta Correlacionada con EXISTS
    public List<Marca> ejercicio18_marcasConArticulosFacturados() {
        String jpql = "SELECT m FROM Marca m WHERE EXISTS (" +
                "  SELECT d FROM FacturaVentaDetalle d " +
                "  WHERE d.listaPrecioArticulo.articulo.marca = m" +
                ")";
        return em.createQuery(jpql, Marca.class).getResultList();
    }

    // 19. Subconsulta Correlacionada con NOT EXISTS
    public List<Articulo> ejercicio19_articulosNuncaFacturados() {
        String jpql = "SELECT a FROM Articulo a WHERE NOT EXISTS (" +
                "  SELECT d FROM FacturaVentaDetalle d " +
                "  WHERE d.listaPrecioArticulo.articulo = a" +
                ")";
        return em.createQuery(jpql, Articulo.class).getResultList();
    }

    // 20. Proyección Condicional (CASE WHEN)
    public List<Object[]> ejercicio20_clasificacionFacturas() {
        String jpql = "SELECT f.numero, f.importeTotal, " +
                "  CASE " +
                "    WHEN f.importeTotal > 50000 THEN 'ALTO VALOR' " +
                "    WHEN f.importeTotal BETWEEN 10000 AND 50000 THEN 'MEDIO VALOR' " +
                "    ELSE 'BAJO VALOR' " +
                "  END " +
                "FROM FacturaVenta f " +
                "ORDER BY f.importeTotal DESC";
        return em.createQuery(jpql, Object[].class).getResultList();
    }
}
