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
@CrossOrigin(origins = "*")
public class CatalogoController {

    private final ListaPrecioArticuloRepository repository;

    public CatalogoController(ListaPrecioArticuloRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/articulos")
    public List<ArticuloCatalogoDTO> obtenerCatalogo() {
        return repository.findAll().stream()
                .filter(lpa -> lpa.getArticulo() != null && lpa.getArticulo().getFechaBaja() == null)
                .map(lpa -> new ArticuloCatalogoDTO(
                        lpa.getId(),
                        lpa.getArticulo().getId(),
                        lpa.getArticulo().getCodigo(),
                        lpa.getArticulo().getDenominacion(),
                        lpa.getArticulo().getRubro() != null ? lpa.getArticulo().getRubro().getDenominacion() : "Sin rubro",
                        lpa.getArticulo().getMarca() != null ? lpa.getArticulo().getMarca().getDenominacion() : "Sin marca",
                        lpa.getPrecioVenta(),
                        lpa.getListaPrecio().getId(),
                        lpa.getListaPrecio().getCodigo(),
                        lpa.getListaPrecio().getDenominacion()
                ))
                .collect(Collectors.toList());
    }
}