package ar.edu.utn.controlador;

import ar.edu.utn.modelo.FacturaVenta;
import ar.edu.utn.modelo.FacturaVentaDetalle;
import ar.edu.utn.repositorio.FacturaVentaRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
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
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            String nroComprobante = factura.getNumero() != null
                    ? String.format("%04d-%08d", factura.getPuntoVenta().getNumero(), factura.getNumero())
                    : "BORRADOR (SIN EMITIR)";

            String fechaStr = factura.getFechaEmision() != null
                    ? new SimpleDateFormat("dd/MM/yyyy HH:mm").format(factura.getFechaEmision())
                    : "Pendiente de emisión";

            document.add(new Paragraph("FACTURA C (Cód. 11) - COMPROBANTE N°: " + nroComprobante, titleFont));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Fecha de Emisión: " + fechaStr, normalFont));
            document.add(new Paragraph("Punto de Venta: " + factura.getPuntoVenta().getNumero() + " - " + factura.getPuntoVenta().getDescripcion(), normalFont));
            document.add(new Paragraph("Cliente: " + (factura.getCliente() != null ? factura.getCliente().getDenominacion() : "Consumidor Final"), normalFont));
            if (factura.getCliente() != null && factura.getCliente().getCuitCuil() != null) {
                document.add(new Paragraph("CUIT/CUIL: " + factura.getCliente().getCuitCuil(), normalFont));
            }
            document.add(new Paragraph("Condición frente al IVA: " + factura.getCondicionIva().getDenominacion(), normalFont));
            if (factura.getListaPrecio() != null) {
                document.add(new Paragraph("Lista de Precios: " + factura.getListaPrecio().getDenominacion(), normalFont));
            }
            document.add(new Paragraph(" "));

            // Tabla de ítems SIN IVA discriminado (normativa Factura C)
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3.5f, 1.5f, 1.2f, 1.3f, 1.8f});

            String[] headersTabla = {"Descripción", "Precio Unit.", "Cantidad", "Bonif. %", "Subtotal"};
            for (String h : headersTabla) {
                PdfPCell cell = new PdfPCell(new Phrase(h, boldFont));
                cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
                cell.setPadding(6);
                table.addCell(cell);
            }

            for (FacturaVentaDetalle detalle : factura.getDetalles()) {
                table.addCell(new PdfPCell(new Phrase(detalle.getDescripcion(), normalFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("$ %.2f", detalle.getPrecioUnitario()), normalFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("%.2f", detalle.getCantidad()), normalFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("%.2f%%", detalle.getPorcentajeBonificacion()), normalFont)));
                table.addCell(new PdfPCell(new Phrase(String.format("$ %.2f", detalle.getImporteSubtotal()), normalFont)));
            }

            document.add(table);
            document.add(new Paragraph(" "));

            Paragraph totalP = new Paragraph(String.format("IMPORTE TOTAL: $ %.2f", factura.getImporteTotal()), titleFont);
            totalP.setAlignment(Element.ALIGN_RIGHT);
            document.add(totalP);
            document.add(new Paragraph(" "));

            if (factura.getCae() != null && !factura.getCae().isEmpty()) {
                document.add(new Paragraph("CAE N° (Autorización ARCA): " + factura.getCae(), boldFont));
                document.add(new Paragraph("Fecha de Vto. de CAE: " + new SimpleDateFormat("dd/MM/yyyy").format(factura.getCaeFechaVencimiento()), normalFont));
            } else {
                document.add(new Paragraph("DOCUMENTO NO VÁLIDO COMO FACTURA - COMPROBANTE SIN EMITIR", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, BaseColor.RED)));
            }

            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String nombreArchivo = factura.getNumero() != null ? "Factura_C_" + factura.getNumero() + ".pdf" : "Borrador_Factura_" + factura.getId() + ".pdf";
            headers.setContentDispositionFormData("filename", nombreArchivo);

            return new ResponseEntity<>(out.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}