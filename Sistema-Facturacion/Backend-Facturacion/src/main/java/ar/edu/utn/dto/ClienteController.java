package ar.edu.utn.controlador;

import ar.edu.utn.dto.ClienteDTO;
import ar.edu.utn.repositorio.ClienteRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    private final ClienteRepository repository;

    public ClienteController(ClienteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ClienteDTO> obtenerClientes() {
        return repository.findAll().stream()
                .map(c -> new ClienteDTO(c.getId(), c.getCuitCuil(), c.getDenominacion()))
                .collect(Collectors.toList());
    }
}