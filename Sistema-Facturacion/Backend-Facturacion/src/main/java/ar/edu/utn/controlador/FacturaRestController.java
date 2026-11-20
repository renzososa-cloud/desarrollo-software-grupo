package ar.edu.utn.controlador;

import ar.edu.utn.dto.FacturaReporteDTO;
import ar.edu.utn.dto.FacturaRequestDTO;
import ar.edu.utn.dto.FacturaResponseDTO;
import ar.edu.utn.modelo.FacturaVenta;
import ar.edu.utn.modelo.ListaPrecio;
import ar.edu.utn.repositorio.ListaPrecioRepository;
import ar.edu.utn.servicio.FacturaService;
import ar.edu.utn.servicio.ReporteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/facturas")
@CrossOrigin(origins = "*")
public class FacturaRestController {

    private final FacturaService facturaService;
    private final ReporteService reporteService;
    private final ListaPrecioRepository listaPrecioRepository;

    @Autowired
    public FacturaRestController(FacturaService facturaService, ReporteService reporteService, ListaPrecioRepository listaPrecioRepository) {
        this.facturaService = facturaService;
        this.reporteService = reporteService;
        this.listaPrecioRepository = listaPrecioRepository;
    }

    @GetMapping
    public ResponseEntity<Page<FacturaReporteDTO>> buscarFacturasFiltradas(
            @RequestParam(defaultValue = "SIN_EMITIR") String tab,
            @RequestParam(required = false) Long numero,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaHasta,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) Double montoMinimo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<FacturaReporteDTO> result = facturaService.buscarFacturasPaginadas(tab, numero, fechaDesde, fechaHasta, cliente, montoMinimo, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacturaResponseDTO> obtenerFacturaPorId(@PathVariable Long id) {
        return ResponseEntity.ok(facturaService.obtenerPorId(id));
    }

    @GetMapping("/listas-precios")
    public ResponseEntity<List<ListaPrecio>> obtenerListasPrecios() {
        return ResponseEntity.ok(listaPrecioRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<FacturaResponseDTO> crearFactura(@RequestBody FacturaRequestDTO requestDTO) {
        FacturaVenta facturaCreada = facturaService.crear(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(facturaService.mapearAResponseDto(facturaCreada));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacturaResponseDTO> actualizarFactura(@PathVariable Long id, @RequestBody FacturaRequestDTO requestDTO) {
        FacturaVenta facturaActualizada = facturaService.actualizar(id, requestDTO);
        return ResponseEntity.ok(facturaService.mapearAResponseDto(facturaActualizada));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarFactura(@PathVariable Long id) {
        facturaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @RequestMapping(value = "/{id}/restaurar", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<Void> restaurarFactura(@PathVariable Long id) {
        facturaService.restaurar(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping({"/{id}/definitivo", "/{id}/permanente"})
    public ResponseEntity<Void> eliminarFacturaDefinitiva(@PathVariable Long id) {
        facturaService.eliminarDefinitivo(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/informar-arca")
    public ResponseEntity<?> informarArca(@PathVariable Long id) {
        try {
            FacturaVenta facturaInformada = facturaService.informarArca(id);
            return ResponseEntity.ok(facturaService.mapearAResponseDto(facturaInformada));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdf(
            @RequestParam(defaultValue = "EMITIDA") String tab,
            @RequestParam(required = false) Long numero,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaHasta,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) Double montoMinimo
    ) {
        List<FacturaReporteDTO> facturas = facturaService.buscarFacturasListado(tab, numero, fechaDesde, fechaHasta, cliente, montoMinimo);
        byte[] pdfBytes = reporteService.generarReportePdf(facturas);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=reporte_facturas.pdf")
                .header("Content-Type", "application/pdf")
                .body(pdfBytes);
    }

    @GetMapping("/exportar/excel")
    public ResponseEntity<byte[]> exportarExcel(
            @RequestParam(defaultValue = "EMITIDA") String tab,
            @RequestParam(required = false) Long numero,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaHasta,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) Double montoMinimo
    ) {
        List<FacturaReporteDTO> facturas = facturaService.buscarFacturasListado(tab, numero, fechaDesde, fechaHasta, cliente, montoMinimo);
        byte[] excelBytes = reporteService.generarReporteTxt(facturas);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=reporte_facturas.xls")
                .header("Content-Type", "application/vnd.ms-excel")
                .body(excelBytes);
    }
}