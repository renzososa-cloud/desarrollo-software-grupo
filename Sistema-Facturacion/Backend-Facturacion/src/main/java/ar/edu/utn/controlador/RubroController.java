package ar.edu.utn.controlador;

import ar.edu.utn.modelo.Rubro;
import ar.edu.utn.modelo.Usuario;
import ar.edu.utn.repositorio.RubroRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rubros")
@CrossOrigin(origins = "*")
public class RubroController {

    private final RubroRepository rubroRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public RubroController(RubroRepository rubroRepository) {
        this.rubroRepository = rubroRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Object> listarRubros() {
        return rubroRepository.findAll().stream()
                .sorted(Comparator.comparing(Rubro::getId).reversed())
                .map(this::mapearRubro)
                .collect(Collectors.toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> crearRubro(@RequestBody Map<String, Object> body) {
        String denominacion = Objects.toString(body.get("denominacion"), "").trim();
        if (denominacion.isEmpty()) {
            return ResponseEntity.badRequest().body("La denominación del rubro es obligatoria.");
        }

        int siguienteCodigo = rubroRepository.findAll().stream()
                .map(Rubro::getCodigo)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        Date ahora = new Date();
        Usuario usuario = obtenerUsuarioSistema();

        Rubro r = new Rubro();
        r.setCodigo(siguienteCodigo);
        r.setDenominacion(denominacion);
        r.setFechaAlta(ahora);
        r.setFechaModificacion(ahora);
        r.setUsuarioCarga(usuario);
        r.setUsuarioModificacion(usuario);

        Rubro guardado = rubroRepository.save(r);
        return ResponseEntity.ok(mapearRubro(guardado));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> actualizarRubro(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String denominacion = Objects.toString(body.get("denominacion"), "").trim();
        if (denominacion.isEmpty()) {
            return ResponseEntity.badRequest().body("La denominación es obligatoria.");
        }

        Optional<Rubro> opt = rubroRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Rubro r = opt.get();
        r.setDenominacion(denominacion);
        r.setFechaModificacion(new Date());
        r.setUsuarioModificacion(obtenerUsuarioSistema());

        return ResponseEntity.ok(mapearRubro(rubroRepository.save(r)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> darDeBajaRubro(@PathVariable Long id) {
        Optional<Rubro> opt = rubroRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Date ahora = new Date();
        Usuario usuario = obtenerUsuarioSistema();

        Rubro r = opt.get();
        r.setFechaBaja(ahora);
        r.setUsuarioBaja(usuario);
        r.setFechaModificacion(ahora);
        r.setUsuarioModificacion(usuario);
        rubroRepository.save(r);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/restaurar")
    @Transactional
    public ResponseEntity<?> restaurarRubro(@PathVariable Long id) {
        Optional<Rubro> opt = rubroRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Rubro r = opt.get();
        r.setFechaBaja(null);
        r.setUsuarioBaja(null);
        r.setFechaModificacion(new Date());
        r.setUsuarioModificacion(obtenerUsuarioSistema());
        rubroRepository.save(r);
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> mapearRubro(Rubro r) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", r.getId());
        map.put("codigo", r.getCodigo() != null ? String.valueOf(r.getCodigo()) : "");
        map.put("denominacion", r.getDenominacion());
        map.put("fechaAlta", r.getFechaAlta());
        map.put("fechaBaja", r.getFechaBaja());
        map.put("activo", r.getFechaBaja() == null);
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