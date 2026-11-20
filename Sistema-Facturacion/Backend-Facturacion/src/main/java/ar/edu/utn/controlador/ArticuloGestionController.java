package ar.edu.utn.controlador;

import ar.edu.utn.modelo.*;
import ar.edu.utn.repositorio.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/articulos-gestion")
@CrossOrigin(origins = "*")
public class ArticuloGestionController {

    private final ArticuloRepository articuloRepository;
    private final ListaPrecioRepository listaPrecioRepository;
    private final ListaPrecioArticuloRepository lpaRepository;
    private final RubroRepository rubroRepository;
    private final MarcaRepository marcaRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public ArticuloGestionController(ArticuloRepository articuloRepository,
                                     ListaPrecioRepository listaPrecioRepository,
                                     ListaPrecioArticuloRepository lpaRepository,
                                     RubroRepository rubroRepository,
                                     MarcaRepository marcaRepository) {
        this.articuloRepository = articuloRepository;
        this.listaPrecioRepository = listaPrecioRepository;
        this.lpaRepository = lpaRepository;
        this.rubroRepository = rubroRepository;
        this.marcaRepository = marcaRepository;
    }

    public static class PrecioItem {
        public Long listaPrecioId;
        public Double precioVenta;
    }

    public static class ArticuloRequest {
        public String denominacion;
        public Long rubroId;
        public Long marcaId;
        public List<PrecioItem> precios;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Object> listarArticulosPorLista() {
        return lpaRepository.findAll().stream()
                .filter(lpa -> lpa.getArticulo() != null
                        && lpa.getListaPrecio() != null
                        && lpa.getFechaBaja() == null
                        && lpa.getArticulo().getFechaBaja() == null)
                .sorted(Comparator.comparing((ListaPrecioArticulo lpa) -> lpa.getArticulo().getId()).reversed())
                .map(lpa -> {
                    Articulo art = lpa.getArticulo();
                    ListaPrecio lp = lpa.getListaPrecio();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("listaPrecioArticuloId", lpa.getId());
                    row.put("articuloId", art.getId());
                    row.put("codigo", art.getCodigo());
                    row.put("denominacion", art.getDenominacion());
                    row.put("rubroId", art.getRubro() != null ? art.getRubro().getId() : null);
                    row.put("rubroNombre", art.getRubro() != null ? art.getRubro().getDenominacion() : "Sin rubro");
                    row.put("marcaId", art.getMarca() != null ? art.getMarca().getId() : null);
                    row.put("marcaNombre", art.getMarca() != null ? art.getMarca().getDenominacion() : "Sin marca");
                    row.put("listaPrecioId", lp.getId());
                    row.put("listaPrecioCodigo", lp.getCodigo());
                    row.put("listaNombre", lp.getDenominacion());
                    row.put("precioVenta", lpa.getPrecioVenta());
                    row.put("fechaBaja", art.getFechaBaja());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> crearArticulo(@RequestBody ArticuloRequest body) {
        String denominacion = body.denominacion != null ? body.denominacion.trim() : "";
        if (denominacion.isEmpty()) {
            return ResponseEntity.badRequest().body("La denominación del artículo es obligatoria.");
        }
        if (body.rubroId == null) {
            return ResponseEntity.badRequest().body("Debe seleccionar un rubro para el artículo.");
        }
        if (body.precios == null || body.precios.isEmpty()) {
            return ResponseEntity.badRequest().body("Debe habilitar al menos una lista de precios.");
        }

        Rubro rubro = rubroRepository.findById(body.rubroId).orElse(null);
        if (rubro == null) {
            return ResponseEntity.badRequest().body("El rubro seleccionado no existe.");
        }

        Date ahora = new Date();
        Usuario usuario = obtenerUsuarioSistema();

        Articulo art = new Articulo();
        art.setDenominacion(denominacion);
        art.setRubro(rubro);
        art.setMarca(body.marcaId != null ? marcaRepository.findById(body.marcaId).orElse(null) : null);
        art.setFechaAlta(ahora);
        art.setFechaModificacion(ahora);
        art.setUsuarioCarga(usuario);
        art.setUsuarioModificacion(usuario);

        art.setCodigo("TMP-" + System.currentTimeMillis());
        art = articuloRepository.save(art);
        art.setCodigo(String.format("ART-%06d", art.getId()));
        art = articuloRepository.save(art);

        guardarPreciosArticulo(art, body.precios, usuario, ahora);
        return ResponseEntity.ok(Map.of("id", art.getId(), "codigo", art.getCodigo()));
    }

    @PutMapping("/{articuloId}")
    @Transactional
    public ResponseEntity<?> actualizarArticulo(@PathVariable Long articuloId, @RequestBody ArticuloRequest body) {
        Optional<Articulo> opt = articuloRepository.findById(articuloId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String denominacion = body.denominacion != null ? body.denominacion.trim() : "";
        if (denominacion.isEmpty()) {
            return ResponseEntity.badRequest().body("La denominación del artículo es obligatoria.");
        }
        if (body.rubroId == null) {
            return ResponseEntity.badRequest().body("Debe seleccionar un rubro para el artículo.");
        }
        if (body.precios == null || body.precios.isEmpty()) {
            return ResponseEntity.badRequest().body("Debe habilitar al menos una lista de precios.");
        }

        Rubro rubro = rubroRepository.findById(body.rubroId).orElse(null);
        if (rubro == null) {
            return ResponseEntity.badRequest().body("El rubro seleccionado no existe.");
        }

        Date ahora = new Date();
        Usuario usuario = obtenerUsuarioSistema();

        Articulo art = opt.get();
        art.setDenominacion(denominacion);
        art.setRubro(rubro);
        art.setMarca(body.marcaId != null ? marcaRepository.findById(body.marcaId).orElse(null) : null);
        art.setFechaModificacion(ahora);
        art.setUsuarioModificacion(usuario);
        articuloRepository.save(art);

        guardarPreciosArticulo(art, body.precios, usuario, ahora);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{articuloId}")
    @Transactional
    public ResponseEntity<?> darDeBajaArticulo(@PathVariable Long articuloId) {
        Optional<Articulo> opt = articuloRepository.findById(articuloId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Date ahora = new Date();
        Usuario usuario = obtenerUsuarioSistema();

        Articulo art = opt.get();
        art.setFechaBaja(ahora);
        art.setUsuarioBaja(usuario);
        art.setFechaModificacion(ahora);
        art.setUsuarioModificacion(usuario);
        articuloRepository.save(art);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{articuloId}/restaurar")
    @Transactional
    public ResponseEntity<?> restaurarArticulo(@PathVariable Long articuloId) {
        Optional<Articulo> opt = articuloRepository.findById(articuloId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Articulo art = opt.get();
        art.setFechaBaja(null);
        art.setUsuarioBaja(null);
        art.setFechaModificacion(new Date());
        art.setUsuarioModificacion(obtenerUsuarioSistema());
        articuloRepository.save(art);
        return ResponseEntity.ok().build();
    }

    private void guardarPreciosArticulo(Articulo art, List<PrecioItem> precios, Usuario usuario, Date ahora) {
        List<ListaPrecioArticulo> existentes = lpaRepository.findAll().stream()
                .filter(l -> l.getArticulo() != null && l.getArticulo().getId().equals(art.getId()))
                .collect(Collectors.toList());

        Set<Long> listasActivasIds = new HashSet<>();

        for (PrecioItem p : precios) {
            if (p.listaPrecioId == null || p.precioVenta == null) {
                continue;
            }
            Long listaId = p.listaPrecioId;
            double precioVenta = p.precioVenta;
            listasActivasIds.add(listaId);

            Optional<ListaPrecioArticulo> yaExiste = existentes.stream()
                    .filter(e -> e.getListaPrecio().getId().equals(listaId))
                    .findFirst();

            if (yaExiste.isPresent()) {
                ListaPrecioArticulo lpa = yaExiste.get();
                lpa.setPrecioVenta(precioVenta);
                lpa.setFechaBaja(null);
                lpa.setUsuarioBaja(null);
                lpa.setFechaModificacion(ahora);
                lpa.setUsuarioModificacion(usuario);
                lpaRepository.save(lpa);
            } else {
                listaPrecioRepository.findById(listaId).ifPresent(lp -> {
                    ListaPrecioArticulo nuevo = new ListaPrecioArticulo();
                    nuevo.setArticulo(art);
                    nuevo.setListaPrecio(lp);
                    nuevo.setPrecioVenta(precioVenta);
                    nuevo.setFechaAlta(ahora);
                    nuevo.setFechaModificacion(ahora);
                    nuevo.setUsuarioCarga(usuario);
                    nuevo.setUsuarioModificacion(usuario);
                    lpaRepository.save(nuevo);
                });
            }
        }

        for (ListaPrecioArticulo viejo : existentes) {
            if (!listasActivasIds.contains(viejo.getListaPrecio().getId())) {
                Long usosEnFacturas = entityManager.createQuery(
                                "SELECT COUNT(d) FROM FacturaVentaDetalle d WHERE d.listaPrecioArticulo.id = :lpaId", Long.class)
                        .setParameter("lpaId", viejo.getId())
                        .getSingleResult();

                if (usosEnFacturas > 0) {
                    viejo.setFechaBaja(ahora);
                    viejo.setUsuarioBaja(usuario);
                    viejo.setFechaModificacion(ahora);
                    viejo.setUsuarioModificacion(usuario);
                    lpaRepository.save(viejo);
                } else {
                    lpaRepository.delete(viejo);
                }
            }
        }
    }

    private Usuario obtenerUsuarioSistema() {
        Usuario u = entityManager.find(Usuario.class, 1L);
        if (u != null) {
            return u;
        }
        List<Usuario> lista = entityManager.createQuery("SELECT u FROM Usuario u", Usuario.class)
                .setMaxResults(1)
                .getResultList();
        if (lista.isEmpty()) {
            throw new RuntimeException("No existe ningún usuario en la tabla 'usuario' para registrar auditoría.");
        }
        return lista.get(0);
    }
}