package ar.edu.utn.controlador;

import ar.edu.utn.modelo.FacturaVenta;
import ar.edu.utn.repositorio.FacturaVentaRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;

@RestController
@RequestMapping("/api/facturas")
@CrossOrigin(origins = "*")
public class FacturaPdfController {

    private final FacturaVentaRepository repository;

    public FacturaPdfController(FacturaVentaRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        FacturaVenta factura = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));

        try {
            Document document = new Document();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            document.add(new Paragraph("FACTURA ELECTRÓNICA NRO: " + factura.getNumero(), titleFont));
            document.add(new Paragraph("---------------------------------------------------------"));
            document.add(new Paragraph("Fecha de Emisión: " + new SimpleDateFormat("dd/MM/yyyy").format(factura.getFechaEmision()), normalFont));
            document.add(new Paragraph("Punto de Venta: " + factura.getPuntoVenta().getNumero(), normalFont));
            document.add(new Paragraph("Cliente: " + (factura.getCliente() != null ? factura.getCliente().getDenominacion() : "Consumidor Final"), normalFont));
            document.add(new Paragraph("Condición IVA: " + factura.getCondicionIva().getDenominacion(), normalFont));
            document.add(new Paragraph("---------------------------------------------------------"));

            document.add(new Paragraph("Detalle de Ítems:", subtitleFont));
            factura.getDetalles().forEach(detalle -> {
                try {
                    document.add(new Paragraph("- " + detalle.getCantidad() + "x " + detalle.getDescripcion() +
                            " | Subtotal: $" + detalle.getImporteSubtotal(), normalFont));
                } catch (DocumentException e) {
                    e.printStackTrace();
                }
            });

            document.add(new Paragraph("---------------------------------------------------------"));
            document.add(new Paragraph("IMPORTE TOTAL: $" + factura.getImporteTotal(), titleFont));
            document.add(new Paragraph(" "));

            // REQUISITO DE LA CÁTEDRA: Imprimir CAI/CAE y Fecha Vto
            if (factura.getCae() != null && !factura.getCae().isEmpty()) {
                document.add(new Paragraph("CAI / CAE (Autorización ARCA): " + factura.getCae(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                document.add(new Paragraph("Fecha Vto. CAI / CAE: " + new SimpleDateFormat("dd/MM/yyyy").format(factura.getCaeFechaVencimiento()), normalFont));
            } else {
                document.add(new Paragraph("DOCUMENTO NO VÁLIDO COMO FACTURA - NO INFORMADO A ARCA", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.RED)));
            }

            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "Factura_" + factura.getNumero() + ".pdf");

            return new ResponseEntity<>(out.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}