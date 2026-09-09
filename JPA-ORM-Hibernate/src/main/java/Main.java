

import java.util.Date;

import ar.edu.utn.modelo.Articulo;
import ar.edu.utn.modelo.FacturaVenta;
import ar.edu.utn.modelo.FacturaVentaDetalle;
import ar.edu.utn.modelo.ListaPrecio;
import ar.edu.utn.modelo.ListaPrecioArticulo;
import ar.edu.utn.modelo.Marca;
import ar.edu.utn.modelo.PuntoVenta;
import ar.edu.utn.modelo.Rubro;
import ar.edu.utn.modelo.Usuario;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

public class Main {

    public static void main(String[] args) {

        EntityManagerFactory emf = Persistence.createEntityManagerFactory("FacturacionPU");
        EntityManager em = emf.createEntityManager();

        try {
            em.getTransaction().begin();

            Date ahora = new Date();

            // ------------------------------------------------------------------
            // 1) Usuario "de sistema" que figura como usuarioCarga/usuarioModificacion
            //    en todas las entidades que heredan de AuditoriaApp.
            //    Como ManyToOne NO tiene cascade, este Usuario debe persistirse
            //    ANTES de ser referenciado por cualquier otra entidad.
            // ------------------------------------------------------------------
            Usuario usuario = new Usuario();
            usuario.setUsuario("rsosa");
            usuario.setClave("123456");
            usuario.setNombre("Renzo");
            usuario.setApellido("Sosa");
            em.persist(usuario);

            // ------------------------------------------------------------------
            // 2) Entidades "maestras" que la FacturaVentaDetalle necesita
            //    a traves de ListaPrecioArticulo. Tampoco tienen cascade,
            //    asi que se persisten explicitamente.
            // ------------------------------------------------------------------
            Rubro rubro = new Rubro();
            rubro.setDenominacion("Bebidas");
            rubro.setCodigo(10);
            rubro.setFechaAlta(ahora);
            rubro.setFechaModificacion(ahora);
            rubro.setUsuarioCarga(usuario);
            rubro.setUsuarioModificacion(usuario);
            em.persist(rubro);

            Marca marca = new Marca();
            marca.setDenominacion("Coca-Cola");
            marca.setCodigo(5);
            marca.setFechaAlta(ahora);
            marca.setFechaModificacion(ahora);
            marca.setUsuarioCarga(usuario);
            marca.setUsuarioModificacion(usuario);
            em.persist(marca);

            Articulo articulo = new Articulo();
            articulo.setCodigo("ART-001");
            articulo.setDenominacion("Gaseosa 2.25L");
            articulo.setRubro(rubro);
            articulo.setMarca(marca);
            articulo.setFechaAlta(ahora);
            articulo.setFechaModificacion(ahora);
            articulo.setUsuarioCarga(usuario);
            articulo.setUsuarioModificacion(usuario);
            em.persist(articulo);

            ListaPrecio listaPrecio = new ListaPrecio();
            listaPrecio.setCodigo("LP-01");
            listaPrecio.setDenominacion("Lista General");
            listaPrecio.setFechaAlta(ahora);
            listaPrecio.setFechaModificacion(ahora);
            listaPrecio.setUsuarioCarga(usuario);
            listaPrecio.setUsuarioModificacion(usuario);
            em.persist(listaPrecio);

            ListaPrecioArticulo listaPrecioArticulo = new ListaPrecioArticulo();
            listaPrecioArticulo.setListaPrecio(listaPrecio);
            listaPrecioArticulo.setArticulo(articulo);
            listaPrecioArticulo.setPrecioVenta(1500.0);
            listaPrecioArticulo.setFechaAlta(ahora);
            listaPrecioArticulo.setFechaModificacion(ahora);
            listaPrecioArticulo.setUsuarioCarga(usuario);
            listaPrecioArticulo.setUsuarioModificacion(usuario);
            em.persist(listaPrecioArticulo);

            PuntoVenta puntoVenta = new PuntoVenta();
            puntoVenta.setNumero(1);
            puntoVenta.setDescripcion("Casa Central");
            puntoVenta.setTipoEmision("Electronica");
            puntoVenta.setDomicilioComercial("Godoy Cruz, Mendoza");
            puntoVenta.setFechaAlta(ahora);
            puntoVenta.setFechaModificacion(ahora);
            puntoVenta.setUsuarioCarga(usuario);
            puntoVenta.setUsuarioModificacion(usuario);
            em.persist(puntoVenta);

            // ------------------------------------------------------------------
            // 3) Cabecera FacturaVenta + su(s) detalle(s), asociados
            //    bidireccionalmente (detalle.factura <-> factura.detalles).
            // ------------------------------------------------------------------
            FacturaVenta facturaVenta = new FacturaVenta();
            facturaVenta.setNumero(1L);
            facturaVenta.setFechaEmision(ahora);
            facturaVenta.setPuntoVenta(puntoVenta);
            facturaVenta.setImporteTotal(3000.0);
            facturaVenta.setImporteCobrado(3000.0);
            facturaVenta.setImporteSaldo(0.0);
            facturaVenta.setEstado("EMITIDA");
            facturaVenta.setFechaAlta(ahora);
            facturaVenta.setFechaModificacion(ahora);
            facturaVenta.setUsuarioCarga(usuario);
            facturaVenta.setUsuarioModificacion(usuario);

            FacturaVentaDetalle detalle1 = new FacturaVentaDetalle();
            detalle1.setListaPrecioArticulo(listaPrecioArticulo);
            detalle1.setDescripcion("Gaseosa 2.25L");
            detalle1.setCantidad(2);
            detalle1.setPrecioUnitario(1500.0);
            detalle1.setImporteSubtotal(3000.0);

            // addDetalle() hace las dos cosas a la vez: agrega el detalle a la
            // lista de la factura y le setea la referencia inversa (factura).
            facturaVenta.addDetalle(detalle1);

            // ------------------------------------------------------------------
            // 4) Requisito clave del TP: UN SOLO em.persist() sobre la cabecera.
            //    Gracias a @OneToMany(cascade = CascadeType.ALL) en FacturaVenta,
            //    Hibernate persiste automaticamente todos los objetos de
            //    "detalles" sin necesidad de llamar a em.persist(detalle1).
            // ------------------------------------------------------------------
            em.persist(facturaVenta);

            em.getTransaction().commit();

            System.out.println("FacturaVenta persistida con id=" + facturaVenta.getId());
            System.out.println("Detalles insertados por cascada: " + facturaVenta.getDetalles().size());

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