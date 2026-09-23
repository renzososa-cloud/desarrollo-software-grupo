package ar.edu.utn;

import ar.edu.utn.modelo.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import java.util.Date;
import java.util.List;

public class Main {

    public static void main(String[] args) {

        EntityManagerFactory emf = Persistence.createEntityManagerFactory("FacturacionPU");
        EntityManager em = emf.createEntityManager();

        try {
            System.out.println("\n=======================================================");
            System.out.println("   EJECUCIÓN DE LAS 20 CONSULTAS JPQL (NIVELES 1 A 5)");
            System.out.println("=======================================================\n");

            ConsultasJPQL repo = new ConsultasJPQL(em);

            // ==========================================
            // NIVEL 1: Consultas Básicas y Proyecciones
            // ==========================================
            System.out.println("--- NIVEL 1 ---");

            // Ejercicio 1
            List<FacturaVenta> res1 = repo.ejercicio01_todasLasFacturas();
            System.out.println("Ej 1 - Total facturas registradas: " + res1.size());

            // Ejercicio 2
            List<Object[]> res2 = repo.ejercicio02_proyeccionFacturas();
            for (Object[] fila : res2) {
                System.out.println("Ej 2 - Nro: " + fila[0] + " | Fecha: " + fila[1] + " | Total: $" + fila[2]);
            }

            // Ejercicio 3
            List<Articulo> res3 = repo.ejercicio03_articulosPorRubro("Bebidas");
            System.out.println("Ej 3 - Articulos rubro Bebidas: " + res3.size());

            // Ejercicio 4
            Date inicio = new Date(0);
            Date fin = new Date();
            List<FacturaVenta> res4 = repo.ejercicio04_facturasPorRangoFechas(inicio, fin);
            System.out.println("Ej 4 - Facturas en rango de fechas: " + res4.size());

            // ==========================================
            // NIVEL 2: Condicionales, LIKE, IN y Agregaciones
            // ==========================================
            System.out.println("\n--- NIVEL 2 ---");

            // Ejercicio 5
            List<FacturaVenta> res5 = repo.ejercicio05_facturasEmitidasSinAnular();
            System.out.println("Ej 5 - Facturas emitidas sin anular (>10000): " + res5.size());

            // Ejercicio 6
            List<Cliente> res6 = repo.ejercicio06_buscarClientesPorNombreOCuit("Juan");
            System.out.println("Ej 6 - Clientes (filtro LIKE / CUIT): " + res6.size());

            // Ejercicio 7
            List<String> res7 = repo.ejercicio07_estadosDistintos();
            System.out.println("Ej 7 - Estados unicos ordenados: " + res7);

            // Ejercicio 8
            Object[] res8 = repo.ejercicio08_agregacionesFacturas();
            System.out.println("Ej 8 - Agregaciones -> Cantidad: " + res8[0] + " | Suma: $" + res8[1] + " | Promedio: $" + res8[2]);

            // Ejercicio 9
            List<PuntoVenta> res9 = repo.ejercicio09_puntosVentaPorNumeros(List.of(1, 2, 3));
            System.out.println("Ej 9 - Puntos de venta con operador IN: " + res9.size());

            // ==========================================
            // NIVEL 3: Navegación, JOINs y Subconsultas
            // ==========================================
            System.out.println("\n--- NIVEL 3 ---");

            // Ejercicio 10
            List<FacturaVenta> res10 = repo.ejercicio10_facturasPorUsuarioCarga("rsosa");
            System.out.println("Ej 10 - Facturas cargadas por usuario 'rsosa': " + res10.size());

            // Ejercicio 11
            List<FacturaVentaDetalle> res11 = repo.ejercicio11_detallesPorPuntoVenta(1);
            System.out.println("Ej 11 - Detalles en Punto de Venta 1: " + res11.size());

            // Ejercicio 12
            List<Object[]> res12 = repo.ejercicio12_articulosConMarcaOpcional();
            System.out.println("Ej 12 - Articulos con marca opcional (LEFT JOIN): " + res12.size());

            // Ejercicio 13
            List<FacturaVenta> res13 = repo.ejercicio13_facturasPorMarcaArticulo("Coca-Cola");
            System.out.println("Ej 13 - Facturas con articulos marca Coca-Cola: " + res13.size());

            // Ejercicio 14
            List<FacturaVenta> res14 = repo.ejercicio14_facturasMayorAlPromedio();
            System.out.println("Ej 14 - Facturas con importe mayor al promedio global: " + res14.size());

            // ==========================================
            // NIVEL 4: Agrupamientos (GROUP BY y HAVING)
            // ==========================================
            System.out.println("\n--- NIVEL 4 ---");

            // Ejercicio 15
            List<Object[]> res15 = repo.ejercicio15_facturacionPorPuntoVenta();
            for (Object[] fila : res15) {
                System.out.println("Ej 15 - Punto: " + fila[0] + " | Facturas: " + fila[1] + " | Recaudado: $" + fila[2]);
            }

            // Ejercicio 16
            List<String> res16 = repo.ejercicio16_usuariosConMasDeCincoFacturas();
            System.out.println("Ej 16 - Usuarios con mas de 5 facturas (HAVING): " + res16);

            // Ejercicio 17
            List<Object[]> res17 = repo.ejercicio17_ventasPorMarca();
            for (Object[] fila : res17) {
                System.out.println("Ej 17 - Marca: " + fila[0] + " | Cant. Unidades: " + fila[1] + " | Facturado: $" + fila[2]);
            }

            // ==========================================
            // NIVEL 5: Subconsultas Correlacionadas y CASE
            // ==========================================
            System.out.println("\n--- NIVEL 5 ---");

            // Ejercicio 18
            List<Marca> res18 = repo.ejercicio18_marcasConArticulosFacturados();
            System.out.println("Ej 18 - Marcas con articulos vendidos (EXISTS): " + res18.size());

            // Ejercicio 19
            List<Articulo> res19 = repo.ejercicio19_articulosNuncaFacturados();
            System.out.println("Ej 19 - Articulos nunca facturados (NOT EXISTS): " + res19.size());

            // Ejercicio 20
            List<Object[]> res20 = repo.ejercicio20_clasificacionFacturas();
            for (Object[] fila : res20) {
                System.out.println("Ej 20 - Factura Nro: " + fila[0] + " | Total: $" + fila[1] + " | Categoria: " + fila[2]);
            }

            System.out.println("\n=======================================================");
            System.out.println("        TODAS LAS CONSULTAS EJECUTADAS CON ÉXITO");
            System.out.println("=======================================================\n");

        } catch (RuntimeException e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw e;
        } finally {
            em.close();
            emf.close();
        }
    }
}