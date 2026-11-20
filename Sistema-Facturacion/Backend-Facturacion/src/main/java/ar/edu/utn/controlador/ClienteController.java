package ar.edu.utn.controlador;

import ar.edu.utn.modelo.Cliente;
import ar.edu.utn.modelo.Contacto;
import ar.edu.utn.modelo.Domicilio;
import ar.edu.utn.modelo.Usuario;
import ar.edu.utn.repositorio.ClienteRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    private final ClienteRepository clienteRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public ClienteController(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Object> listarClientes() {
        return clienteRepository.findAll().stream()
                .sorted(Comparator.comparing(Cliente::getId).reversed())
                .map(this::mapearCliente)
                .collect(Collectors.toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> crearCliente(@RequestBody Map<String, Object> body) {
        String denominacion = Objects.toString(body.get("denominacion"), "").trim();
        String cuitCuil = Objects.toString(body.get("cuitCuil"), "").trim();

        if (denominacion.isEmpty() || cuitCuil.isEmpty()) {
            return ResponseEntity.badRequest().body("La denominación y el CUIT/CUIL son obligatorios.");
        }

        Date ahora = new Date();
        Usuario usuario = obtenerUsuarioSistema();

        Cliente cliente = new Cliente();
        cliente.setFechaAlta(ahora);
        cliente.setFechaModificacion(ahora);
        cliente.setUsuarioCarga(usuario);
        cliente.setUsuarioModificacion(usuario);

        aplicarDatosCliente(cliente, body);
        Cliente guardado = clienteRepository.save(cliente);
        return ResponseEntity.ok(mapearCliente(guardado));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> actualizarCliente(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<Cliente> opt = clienteRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Cliente cliente = opt.get();
        cliente.setFechaModificacion(new Date());
        cliente.setUsuarioModificacion(obtenerUsuarioSistema());

        aplicarDatosCliente(cliente, body);
        Cliente actualizado = clienteRepository.save(cliente);
        return ResponseEntity.ok(mapearCliente(actualizado));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> darDeBajaCliente(@PathVariable Long id) {
        Optional<Cliente> opt = clienteRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Date ahora = new Date();
        Usuario usuario = obtenerUsuarioSistema();

        Cliente cliente = opt.get();
        cliente.setFechaBaja(ahora);
        cliente.setUsuarioBaja(usuario);
        cliente.setFechaModificacion(ahora);
        cliente.setUsuarioModificacion(usuario);
        clienteRepository.save(cliente);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/restaurar")
    @Transactional
    public ResponseEntity<?> restaurarCliente(@PathVariable Long id) {
        Optional<Cliente> opt = clienteRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Cliente cliente = opt.get();
        cliente.setFechaBaja(null);
        cliente.setUsuarioBaja(null);
        cliente.setFechaModificacion(new Date());
        cliente.setUsuarioModificacion(obtenerUsuarioSistema());
        clienteRepository.save(cliente);
        return ResponseEntity.ok().build();
    }

    private void aplicarDatosCliente(Cliente cliente, Map<String, Object> body) {
        cliente.setCuitCuil(Objects.toString(body.get("cuitCuil"), "").trim());
        cliente.setDenominacion(Objects.toString(body.get("denominacion"), "").trim());

        Contacto contacto = cliente.getContacto() != null ? cliente.getContacto() : new Contacto();
        String email = Objects.toString(body.get("email"), "").trim();
        String telefono = Objects.toString(body.get("telefono"), "").trim();
        String celular = Objects.toString(body.get("celular"), "").trim();

        contacto.setEmail(limitar(email.isEmpty() ? "-" : email, 50));
        contacto.setTelefono(limitar(telefono.isEmpty() ? "-" : telefono, 20));
        contacto.setCelular(celular.isEmpty() ? null : limitar(celular, 20));
        cliente.setContacto(contacto);

        Domicilio domicilio = cliente.getDomicilio() != null ? cliente.getDomicilio() : new Domicilio();
        String calle = Objects.toString(body.get("calle"), "").trim();
        String numero = Objects.toString(body.get("numero"), "").trim();
        if (calle.isEmpty() && body.get("domicilio") != null) {
            calle = Objects.toString(body.get("domicilio"), "").trim();
        }
        domicilio.setNombreCalle(limitar(calle.isEmpty() ? "-" : calle, 50));
        domicilio.setNumeroCalle(limitar(numero.isEmpty() ? "S/N" : numero, 20));
        cliente.setDomicilio(domicilio);
    }

    private Map<String, Object> mapearCliente(Cliente c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("cuitCuil", c.getCuitCuil());
        map.put("denominacion", c.getDenominacion());

        String email = c.getContacto() != null ? c.getContacto().getEmail() : "";
        String telefono = c.getContacto() != null ? c.getContacto().getTelefono() : "";
        String celular = c.getContacto() != null ? c.getContacto().getCelular() : "";
        String calle = c.getDomicilio() != null ? c.getDomicilio().getNombreCalle() : "";
        String numero = c.getDomicilio() != null ? c.getDomicilio().getNumeroCalle() : "";
        String domCompleto = (calle + " " + numero).trim();

        map.put("email", email);
        map.put("telefono", telefono);
        map.put("celular", celular);
        map.put("calle", calle);
        map.put("numero", numero);
        map.put("domicilio", domCompleto.isEmpty() ? "—" : domCompleto);
        map.put("fechaAlta", c.getFechaAlta());
        map.put("fechaBaja", c.getFechaBaja());
        map.put("activo", c.getFechaBaja() == null);
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

    private String limitar(String texto, int max) {
        return texto.length() > max ? texto.substring(0, max) : texto;
    }
}