package ar.edu.utn.controlador;

import ar.edu.utn.dto.ArticuloCatalogoDTO;
import ar.edu.utn.repositorio.ListaPrecioArticuloRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/catalogo")
@CrossOrigin(origins = "*") // Permite que tu frontend acceda sin errores de CORS
public class CatalogoController {

    private final ListaPrecioArticuloRepository repository;

    public CatalogoController(ListaPrecioArticuloRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/articulos")
    public List<ArticuloCatalogoDTO> obtenerCatalogo() {
        return repository.findAll().stream()
                .map(lpa -> new ArticuloCatalogoDTO(
                        lpa.getId(),
                        lpa.getArticulo().getDenominacion(),
                        lpa.getPrecioVenta(),
                        lpa.getListaPrecio().getDenominacion()
                ))
                .collect(Collectors.toList());
    }
}