package ar.edu.utn.controlador;

import ar.edu.utn.dto.FacturaReporteDTO;
import ar.edu.utn.dto.FacturaRequestDTO;
import ar.edu.utn.modelo.FacturaVenta;
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

    @Autowired
    public FacturaRestController(FacturaService facturaService, ReporteService reporteService) {
        this.facturaService = facturaService;
        this.reporteService = reporteService;
    }

    @GetMapping
    public ResponseEntity<Page<FacturaReporteDTO>> buscarFacturasFiltradas(
            @RequestParam(required = false) Long numero,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaHasta,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) Boolean informadaArca,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fechaEmision").descending());
        Page<FacturaReporteDTO> result = facturaService.buscarFacturasPaginadas(numero, fechaDesde, fechaHasta, cliente, informadaArca, pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<FacturaReporteDTO> crearFactura(@RequestBody FacturaRequestDTO requestDTO) {
        FacturaVenta facturaCreada = facturaService.crear(requestDTO);
        FacturaReporteDTO reporteDTO = facturaService.mapearADto(facturaCreada);
        return ResponseEntity.status(HttpStatus.CREATED).body(reporteDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacturaReporteDTO> actualizarFactura(@PathVariable Long id, @RequestBody FacturaRequestDTO requestDTO) {
        FacturaVenta facturaActualizada = facturaService.actualizar(id, requestDTO);
        FacturaReporteDTO reporteDTO = facturaService.mapearADto(facturaActualizada);
        return ResponseEntity.ok(reporteDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarFactura(@PathVariable Long id) {
        facturaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/informar-arca")
    public ResponseEntity<FacturaReporteDTO> informarArca(@PathVariable Long id) {
        try {
            FacturaVenta facturaInformada = facturaService.informarArca(id);
            FacturaReporteDTO reporteDTO = facturaService.mapearADto(facturaInformada);
            return ResponseEntity.ok(reporteDTO);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdf(
            @RequestParam(required = false) Long numero,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaHasta,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) Boolean informadaArca
    ) {
        List<FacturaReporteDTO> facturas = facturaService.buscarFacturasListado(numero, fechaDesde, fechaHasta, cliente, informadaArca);
        byte[] pdfBytes = reporteService.generarReportePdf(facturas);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=reporte_facturas.pdf")
                .header("Content-Type", "application/pdf")
                .body(pdfBytes);
    }

    @GetMapping("/exportar/excel")
    public ResponseEntity<byte[]> exportarExcel(
            @RequestParam(required = false) Long numero,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fechaHasta,
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) Boolean informadaArca
    ) {
        List<FacturaReporteDTO> facturas = facturaService.buscarFacturasListado(numero, fechaDesde, fechaHasta, cliente, informadaArca);
        byte[] excelBytes = reporteService.generarReporteTxt(facturas);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=reporte_facturas.xls")
                .header("Content-Type", "application/vnd.ms-excel")
                .body(excelBytes);
    }
}