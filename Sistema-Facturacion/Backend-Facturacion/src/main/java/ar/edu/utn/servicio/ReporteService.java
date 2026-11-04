package ar.edu.utn.servicio;

import ar.edu.utn.dto.FacturaReporteDTO;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class ReporteService {

    // === GENERAR PDF EN MEMORIA PARA DESCARGA HTTP ===
    public byte[] generarReportePdf(List<FacturaReporteDTO> reporte) {
        Document document = new Document(PageSize.A4.rotate()); // Hoja horizontal
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Título del PDF
            Font fontTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph titulo = new Paragraph("Reporte de Facturas Registradas", fontTitulo);
            titulo.setAlignment(Element.ALIGN_CENTER);
            titulo.setSpacingAfter(20);
            document.add(titulo);

            // Tabla de 8 columnas para incluir CAE y Estado
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 1.5f, 2f, 1.5f, 1.5f, 1f, 1.5f, 2f});

            // Header con diseño
            String[] cabeceras = {"Nro", "Fecha", "Cliente", "Punto Venta", "Total", "Items", "Estado", "CAE / ARCA"};
            for (String cabecera : cabeceras) {
                PdfPCell cell = new PdfPCell(new Phrase(cabecera, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            // Llenado de Data
            Font fontDatos = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (FacturaReporteDTO dto : reporte) {
                table.addCell(new Phrase(String.valueOf(dto.getNumeroFactura()), fontDatos));
                table.addCell(new Phrase(dto.getFechaEmision() != null ? dto.getFechaEmision().toString() : "", fontDatos));
                table.addCell(new Phrase(dto.getClienteDenominacion(), fontDatos));
                table.addCell(new Phrase(dto.getPuntoVentaDescripcion(), fontDatos));
                table.addCell(new Phrase(String.format("$%.2f", dto.getImporteTotal()), fontDatos));
                table.addCell(new Phrase(String.valueOf(dto.getCantidadItems()), fontDatos));

                // Color dinámico según el estado (Rojo si está anulada)
                BaseColor colorEstado = "ANULADA".equals(dto.getEstado()) ? BaseColor.RED : BaseColor.BLACK;
                Font fontEstado = FontFactory.getFont(FontFactory.HELVETICA, 9, colorEstado);
                table.addCell(new Phrase(dto.getEstado(), fontEstado));

                // Validar si tiene CAE
                String caeDisplay = (dto.getCae() != null && !dto.getCae().isEmpty()) ? dto.getCae() : "NO INFORMADA";
                table.addCell(new Phrase(caeDisplay, fontDatos));
            }

            document.add(table);
            document.close();

        } catch (DocumentException e) {
            throw new RuntimeException("Error al generar el documento PDF", e);
        }

        return out.toByteArray();
    }

    // === GENERAR EXCEL/TXT EN MEMORIA PARA DESCARGA HTTP ===
    public byte[] generarReporteTxt(List<FacturaReporteDTO> reporte) {
        StringBuilder sb = new StringBuilder();

        sb.append("Número\tFecha\tCliente\tPunto Venta\tImporte Total\tItems\tEstado\tCAE\n");

        for (FacturaReporteDTO dto : reporte) {
            sb.append(String.format("%d\t%s\t%s\t%s\t%.2f\t%d\t%s\t%s\n",
                    dto.getNumeroFactura(),
                    dto.getFechaEmision() != null ? dto.getFechaEmision().toString() : "",
                    dto.getClienteDenominacion(),
                    dto.getPuntoVentaDescripcion(),
                    dto.getImporteTotal(),
                    dto.getCantidadItems(),
                    dto.getEstado(),
                    (dto.getCae() != null && !dto.getCae().isEmpty()) ? dto.getCae() : "NO INFORMADA"));
        }

        return sb.toString().getBytes();
    }
}