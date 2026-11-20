package ar.edu.utn.controlador;

import ar.edu.utn.modelo.Marca;
import ar.edu.utn.modelo.Usuario;
import ar.edu.utn.repositorio.MarcaRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marcas")
@CrossOrigin(origins = "*")
public class MarcaController {

    private final MarcaRepository marcaRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public MarcaController(MarcaRepository marcaRepository) {
        this.marcaRepository = marcaRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Object> listarMarcas() {
        return marcaRepository.findAll().stream()
                .sorted(Comparator.comparing(Marca::getId).reversed())
                .map(this::mapearMarca)
                .collect(Collectors.toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> crearMarca(@RequestBody Map<String, Object> body) {
        String denominacion = Objects.toString(body.get("denominacion"), "").trim();
        if (denominacion.isEmpty()) {
            return ResponseEntity.badRequest().body("La denominación de la marca es obligatoria.");
        }

        int siguienteCodigo = marcaRepository.findAll().stream()
                .map(Marca::getCodigo)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        Date ahora = new Date();
        Usuario usuario = obtenerUsuarioSistema();

        Marca m = new Marca();
        m.setCodigo(siguienteCodigo);
        m.setDenominacion(denominacion);
        m.setFechaAlta(ahora);
        m.setFechaModificacion(ahora);
        m.setUsuarioCarga(usuario);
        m.setUsuarioModificacion(usuario);

        Marca guardada = marcaRepository.save(m);
        return ResponseEntity.ok(mapearMarca(guardada));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> actualizarMarca(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String denominacion = Objects.toString(body.get("denominacion"), "").trim();
        if (denominacion.isEmpty()) {
            return ResponseEntity.badRequest().body("La denominación es obligatoria.");
        }

        Optional<Marca> opt = marcaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Marca m = opt.get();
        m.setDenominacion(denominacion);
        m.setFechaModificacion(new Date());
        m.setUsuarioModificacion(obtenerUsuarioSistema());

        return ResponseEntity.ok(mapearMarca(marcaRepository.save(m)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> darDeBajaMarca(@PathVariable Long id) {
        Optional<Marca> opt = marcaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Date ahora = new Date();
        Usuario usuario = obtenerUsuarioSistema();

        Marca m = opt.get();
        m.setFechaBaja(ahora);
        m.setUsuarioBaja(usuario);
        m.setFechaModificacion(ahora);
        m.setUsuarioModificacion(usuario);
        marcaRepository.save(m);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/restaurar")
    @Transactional
    public ResponseEntity<?> restaurarMarca(@PathVariable Long id) {
        Optional<Marca> opt = marcaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Marca m = opt.get();
        m.setFechaBaja(null);
        m.setUsuarioBaja(null);
        m.setFechaModificacion(new Date());
        m.setUsuarioModificacion(obtenerUsuarioSistema());
        marcaRepository.save(m);
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> mapearMarca(Marca m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("codigo", m.getCodigo() != null ? String.valueOf(m.getCodigo()) : "");
        map.put("denominacion", m.getDenominacion());
        map.put("fechaAlta", m.getFechaAlta());
        map.put("fechaBaja", m.getFechaBaja());
        map.put("activo", m.getFechaBaja() == null);
        return map;
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