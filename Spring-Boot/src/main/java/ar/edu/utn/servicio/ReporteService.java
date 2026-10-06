package ar.edu.utn.servicio;

import ar.edu.utn.dto.FacturaReporteDTO;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import jakarta.persistence.EntityManager;

import java.io.BufferedWriter;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

import org.springframework.stereotype.Service;
import jakarta.persistence.PersistenceContext;

@Service
public class ReporteService {

    @PersistenceContext
    private EntityManager em;

    public void generarReportes() {
        String jpql = "SELECT new ar.edu.utn.dto.FacturaReporteDTO(" +
                " f.numero, " +
                " f.fechaEmision, " +
                " COALESCE(c.denominacion, 'Consumidor Final'), " +
                " ci.denominacion, " +
                " pv.descripcion, " +
                " f.importeTotal, " +
                " COUNT(d) " +
                ") " +
                "FROM FacturaVenta f " +
                "LEFT JOIN f.cliente c " +
                "JOIN f.condicionIva ci " +
                "JOIN f.puntoVenta pv " +
                "JOIN f.detalles d " +
                "GROUP BY f.id, f.numero, f.fechaEmision, c.denominacion, ci.denominacion, pv.descripcion, f.importeTotal";

        List<FacturaReporteDTO> reporte = em.createQuery(jpql, FacturaReporteDTO.class).getResultList();

        generarPDF(reporte, "ReporteFacturas.pdf");
        generarTxt(reporte, "ReporteFacturas.txt");
    }

    private void generarPDF(List<FacturaReporteDTO> reporte, String filepath) {
        Document document = new Document();
        try {
            PdfWriter.getInstance(document, new FileOutputStream(filepath));
            document.open();

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            
            // Header
            table.addCell(new PdfPCell(new Phrase("Número")));
            table.addCell(new PdfPCell(new Phrase("Fecha")));
            table.addCell(new PdfPCell(new Phrase("Cliente")));
            table.addCell(new PdfPCell(new Phrase("Condición IVA")));
            table.addCell(new PdfPCell(new Phrase("Punto Venta")));
            table.addCell(new PdfPCell(new Phrase("Importe Total")));
            table.addCell(new PdfPCell(new Phrase("Items")));

            // Data
            for (FacturaReporteDTO dto : reporte) {
                table.addCell(String.valueOf(dto.getNumeroFactura()));
                table.addCell(dto.getFechaEmision() != null ? dto.getFechaEmision().toString() : "");
                table.addCell(dto.getClienteDenominacion());
                table.addCell(dto.getCondicionIva());
                table.addCell(dto.getPuntoVentaDescripcion());
                table.addCell(String.valueOf(dto.getImporteTotal()));
                table.addCell(String.valueOf(dto.getCantidadItems()));
            }

            document.add(table);
            document.close();
            System.out.println("PDF generado exitosamente en: " + filepath);
        } catch (DocumentException | IOException e) {
            e.printStackTrace();
        }
    }

    private void generarTxt(List<FacturaReporteDTO> reporte, String filepath) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(filepath))) {
            // Header
            writer.write("Número\tFecha\tCliente\tCondición IVA\tPunto Venta\tImporte Total\tItems");
            writer.newLine();

            // Data
            for (FacturaReporteDTO dto : reporte) {
                writer.write(String.format("%d\t%s\t%s\t%s\t%s\t%.2f\t%d",
                        dto.getNumeroFactura(),
                        dto.getFechaEmision() != null ? dto.getFechaEmision().toString() : "",
                        dto.getClienteDenominacion(),
                        dto.getCondicionIva(),
                        dto.getPuntoVentaDescripcion(),
                        dto.getImporteTotal(),
                        dto.getCantidadItems()));
                writer.newLine();
            }
            System.out.println("Archivo TXT/Excel generado exitosamente en: " + filepath);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
