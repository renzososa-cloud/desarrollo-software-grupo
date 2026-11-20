package ar.edu.utn.servicio;

import ar.edu.utn.dto.FacturaReporteDTO;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

@Service
public class ReporteService {

    // =========================================================
    // GENERAR REPORTE PDF HORIZONTAL (A4 LANDSCAPE)
    // =========================================================
    public byte[] generarReportePdf(List<FacturaReporteDTO> reporte) {
        Document document = new Document(PageSize.A4.rotate(), 28, 28, 28, 38);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            PaginacionFooterHelper footerHelper = new PaginacionFooterHelper();
            writer.setPageEvent(footerHelper);

            document.open();

            // Paleta institucional FacturAR
            BaseColor azulOscuro = new BaseColor(15, 23, 42);
            BaseColor azulMarca = new BaseColor(14, 165, 233);
            BaseColor grisFondo = new BaseColor(248, 250, 252);
            BaseColor grisBorde = new BaseColor(203, 213, 225);
            BaseColor grisTexto = new BaseColor(100, 116, 139);

            BaseColor verdeTexto = new BaseColor(5, 150, 105);
            BaseColor ambarTexto = new BaseColor(217, 119, 6);
            BaseColor rojoTexto = new BaseColor(220, 38, 38);

            // Tipografías
            Font fontBrand = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 17, azulOscuro);
            Font fontSubBrand = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, grisTexto);
            Font fontTituloDoc = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, azulOscuro);
            Font fontMeta = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, grisTexto);
            Font fontMetaBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, azulOscuro);

            Font fontKpiLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, grisTexto);
            Font fontKpiVal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, azulOscuro);

            Font fontTh = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, BaseColor.WHITE);
            Font fontTd = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, azulOscuro);
            Font fontTdBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, azulOscuro);
            Font fontTdMuted = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8f, grisTexto);

            String fechaGeneracion = new SimpleDateFormat("dd/MM/yyyy HH:mm").format(new Date());

            // =========================================================
            // 1. ENCABEZADO INSTITUCIONAL
            // =========================================================
            PdfPTable tablaHeader = new PdfPTable(2);
            tablaHeader.setWidthPercentage(100);
            tablaHeader.setWidths(new float[]{5.5f, 4.5f});

            // Izquierda: Logo + Nombre del sistema
            PdfPCell cellIzq = new PdfPCell();
            cellIzq.setBorder(Rectangle.NO_BORDER);
            cellIzq.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cellIzq.setPaddingBottom(8f);

            PdfPTable brandWrap = new PdfPTable(2);
            brandWrap.setWidthPercentage(100);
            brandWrap.setWidths(new float[]{0.85f, 9.15f});

            PdfPCell logoCell = new PdfPCell(crearLogoEmisor(writer, azulMarca));
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            brandWrap.addCell(logoCell);

            PdfPCell titleWrap = new PdfPCell();
            titleWrap.setBorder(Rectangle.NO_BORDER);
            titleWrap.setVerticalAlignment(Element.ALIGN_MIDDLE);
            titleWrap.setPaddingLeft(6f);

            Paragraph pBrand = new Paragraph("FacturAR", fontBrand);
            pBrand.setSpacingAfter(1f);
            titleWrap.addElement(pBrand);
            titleWrap.addElement(new Paragraph("Gestión Comercial y Facturación Electrónica · ARCA", fontSubBrand));
            brandWrap.addCell(titleWrap);

            cellIzq.addElement(brandWrap);
            tablaHeader.addCell(cellIzq);

            // Derecha: Título del reporte + Metadatos
            PdfPCell cellDer = new PdfPCell();
            cellDer.setBorder(Rectangle.NO_BORDER);
            cellDer.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cellDer.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cellDer.setPaddingBottom(8f);

            Paragraph pTit = new Paragraph("LISTADO DE COMPROBANTES", fontTituloDoc);
            pTit.setAlignment(Element.ALIGN_RIGHT);
            pTit.setSpacingAfter(3f);
            cellDer.addElement(pTit);

            Paragraph pGen = new Paragraph();
            pGen.setAlignment(Element.ALIGN_RIGHT);
            pGen.add(new Chunk("Fecha de emisión del reporte: ", fontMeta));
            pGen.add(new Chunk(fechaGeneracion, fontMetaBold));
            cellDer.addElement(pGen);

            Paragraph pEnv = new Paragraph();
            pEnv.setAlignment(Element.ALIGN_RIGHT);
            pEnv.add(new Chunk("Entorno fiscal: ", fontMeta));
            pEnv.add(new Chunk("Homologación ARCA · Factura C (Cód. 011)", fontMetaBold));
            cellDer.addElement(pEnv);

            tablaHeader.addCell(cellDer);
            document.add(tablaHeader);

            // Línea divisoria celeste
            PdfPTable separador = new PdfPTable(1);
            separador.setWidthPercentage(100);
            PdfPCell lineCell = new PdfPCell(new Phrase(" "));
            lineCell.setFixedHeight(2f);
            lineCell.setBackgroundColor(azulMarca);
            lineCell.setBorder(Rectangle.NO_BORDER);
            separador.addCell(lineCell);
            document.add(separador);

            // =========================================================
            // 2. CÁLCULO DE MÉTRICAS Y TARJETAS RESUMEN
            // =========================================================
            int totalComprobantes = reporte != null ? reporte.size() : 0;
            double sumaTotal = 0.0;
            long sumaItems = 0L;
            int cantEmitidas = 0;
            int cantBorradores = 0;

            if (reporte != null) {
                for (FacturaReporteDTO dto : reporte) {
                    sumaTotal += dto.getImporteTotal() != null ? dto.getImporteTotal() : 0.0;
                    sumaItems += dto.getCantidadItems() != null ? dto.getCantidadItems() : 0L;
                    if ("EMITIDA".equalsIgnoreCase(dto.getEstado()) && !dto.isEliminada()) {
                        cantEmitidas++;
                    } else if (!dto.isEliminada() && !"ANULADA".equalsIgnoreCase(dto.getEstado())) {
                        cantBorradores++;
                    }
                }
            }

            PdfPTable tablaKpis = new PdfPTable(3);
            tablaKpis.setWidthPercentage(100);
            tablaKpis.setSpacingBefore(10f);
            tablaKpis.setSpacingAfter(12f);
            tablaKpis.setWidths(new float[]{1f, 1f, 1f});

            String subDetalleCant = String.format("%d emitidas · %d sin emitir", cantEmitidas, cantBorradores);
            agregarTarjetaKpi(tablaKpis, "COMPROBANTES EN REPORTE", String.valueOf(totalComprobantes), subDetalleCant, grisFondo, grisBorde, fontKpiLabel, fontKpiVal, fontSubBrand);
            agregarTarjetaKpi(tablaKpis, "ÍTEMS FACTURADOS", String.valueOf(sumaItems), "Unidades / renglones acumulados", grisFondo, grisBorde, fontKpiLabel, fontKpiVal, fontSubBrand);
            agregarTarjetaKpi(tablaKpis, "IMPORTE TOTAL ACUMULADO", formatearMoneda(sumaTotal), "Moneda: Peso Argentino (ARS)", grisFondo, grisBorde, fontKpiLabel, fontKpiVal, fontSubBrand);

            document.add(tablaKpis);

            // =========================================================
            // 3. TABLA PRINCIPAL DE COMPROBANTES (9 COLUMNAS)
            // =========================================================
            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            table.setHeaderRows(1);
            table.setWidths(new float[]{0.65f, 1.35f, 1.35f, 2.35f, 1.50f, 1.25f, 0.70f, 1.15f, 1.70f});

            String[] cabeceras = {
                    "ID", "N.º Comprobante", "Fecha", "Cliente",
                    "Punto de Venta", "Importe Total", "Ítems", "Estado", "CAE / ARCA"
            };

            for (int i = 0; i < cabeceras.length; i++) {
                PdfPCell cell = new PdfPCell(new Phrase(cabeceras[i], fontTh));
                cell.setBackgroundColor(azulOscuro);
                cell.setBorderColor(azulOscuro);
                cell.setPaddingTop(7f);
                cell.setPaddingBottom(7f);
                cell.setPaddingLeft(5f);
                cell.setPaddingRight(5f);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setHorizontalAlignment(i == 5 ? Element.ALIGN_RIGHT : Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            if (reporte == null || reporte.isEmpty()) {
                PdfPCell emptyCell = new PdfPCell(new Phrase("No se encontraron comprobantes con los filtros seleccionados.", fontTdMuted));
                emptyCell.setColspan(9);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                emptyCell.setPadding(18f);
                emptyCell.setBorderColor(grisBorde);
                table.addCell(emptyCell);
            } else {
                SimpleDateFormat sdfFecha = new SimpleDateFormat("dd/MM/yyyy HH:mm");

                for (int idx = 0; idx < reporte.size(); idx++) {
                    FacturaReporteDTO dto = reporte.get(idx);
                    BaseColor bgFila = (idx % 2 == 1) ? grisFondo : BaseColor.WHITE;

                    // ID
                    agregarCeldaTabla(table, String.valueOf(dto.getId()), fontTd, bgFila, grisBorde, Element.ALIGN_CENTER);

                    // Número
                    if (dto.getNumeroFactura() != null) {
                        String nroFmt = String.format("00001-%08d", dto.getNumeroFactura());
                        agregarCeldaTabla(table, nroFmt, fontTdBold, bgFila, grisBorde, Element.ALIGN_CENTER);
                    } else {
                        agregarCeldaTabla(table, "Sin asignar", fontTdMuted, bgFila, grisBorde, Element.ALIGN_CENTER);
                    }

                    // Fecha (Emisión o Creación interna)
                    Date fechaMostrar = dto.getFechaEmision() != null ? dto.getFechaEmision() : dto.getFechaCreacionInterna();
                    String fechaFmt = fechaMostrar != null ? sdfFecha.format(fechaMostrar) : "—";
                    agregarCeldaTabla(table, fechaFmt, fontTd, bgFila, grisBorde, Element.ALIGN_CENTER);

                    // Cliente
                    String clienteStr = (dto.getClienteDenominacion() != null && !dto.getClienteDenominacion().isBlank())
                            ? dto.getClienteDenominacion()
                            : "Consumidor Final";
                    agregarCeldaTabla(table, clienteStr, fontTdBold, bgFila, grisBorde, Element.ALIGN_LEFT);

                    // Punto de Venta
                    String pvStr = (dto.getPuntoVentaDescripcion() != null && !dto.getPuntoVentaDescripcion().isBlank())
                            ? dto.getPuntoVentaDescripcion()
                            : "Sucursal Central";
                    agregarCeldaTabla(table, pvStr, fontTd, bgFila, grisBorde, Element.ALIGN_CENTER);

                    // Importe Total
                    double imp = dto.getImporteTotal() != null ? dto.getImporteTotal() : 0.0;
                    agregarCeldaTabla(table, formatearMoneda(imp), fontTdBold, bgFila, grisBorde, Element.ALIGN_RIGHT);

                    // Ítems
                    long items = dto.getCantidadItems() != null ? dto.getCantidadItems() : 0L;
                    agregarCeldaTabla(table, String.valueOf(items), fontTd, bgFila, grisBorde, Element.ALIGN_CENTER);

                    // Estado con color semántico
                    String estadoLabel;
                    BaseColor colorEstado;
                    if (dto.isEliminada() || "ANULADA".equalsIgnoreCase(dto.getEstado())) {
                        estadoLabel = "Eliminada";
                        colorEstado = rojoTexto;
                    } else if ("EMITIDA".equalsIgnoreCase(dto.getEstado())) {
                        estadoLabel = "Emitida";
                        colorEstado = verdeTexto;
                    } else {
                        estadoLabel = "Sin emitir";
                        colorEstado = ambarTexto;
                    }
                    Font fontEstado = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.2f, colorEstado);
                    agregarCeldaTabla(table, estadoLabel, fontEstado, bgFila, grisBorde, Element.ALIGN_CENTER);

                    // CAE / ARCA
                    boolean tieneCae = dto.getCae() != null && !dto.getCae().trim().isEmpty();
                    agregarCeldaTabla(
                            table,
                            tieneCae ? dto.getCae().trim() : "Pendiente",
                            tieneCae ? fontTd : fontTdMuted,
                            bgFila,
                            grisBorde,
                            Element.ALIGN_CENTER
                    );
                }

                // Fila final de Totales
                BaseColor bgTotal = new BaseColor(226, 232, 240);
                PdfPCell cTotalLabel = new PdfPCell(new Phrase("TOTAL GENERAL (" + totalComprobantes + " comprobantes)", fontTdBold));
                cTotalLabel.setColspan(5);
                cTotalLabel.setBackgroundColor(bgTotal);
                cTotalLabel.setBorderColor(grisBorde);
                cTotalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
                cTotalLabel.setPadding(7f);
                table.addCell(cTotalLabel);

                agregarCeldaTabla(table, formatearMoneda(sumaTotal), fontTdBold, bgTotal, grisBorde, Element.ALIGN_RIGHT);
                agregarCeldaTabla(table, String.valueOf(sumaItems), fontTdBold, bgTotal, grisBorde, Element.ALIGN_CENTER);

                PdfPCell cTotalEmpty = new PdfPCell(new Phrase(""));
                cTotalEmpty.setColspan(2);
                cTotalEmpty.setBackgroundColor(bgTotal);
                cTotalEmpty.setBorderColor(grisBorde);
                table.addCell(cTotalEmpty);
            }

            document.add(table);
            document.close();

        } catch (DocumentException e) {
            throw new RuntimeException("Error al generar el documento PDF", e);
        }

        return out.toByteArray();
    }

    // =========================================================
    // GENERAR EXCEL / TSV CON UTF-8 BOM (SIN ERRORES CON NULL)
    // =========================================================
    public byte[] generarReporteTxt(List<FacturaReporteDTO> reporte) {
        StringBuilder sb = new StringBuilder();
        // BOM UTF-8 para que Microsoft Excel reconozca acentos y símbolos correctamente
        sb.append('\uFEFF');
        sb.append("ID\tNúmero\tFecha\tCliente\tCondición IVA\tPunto de Venta\tImporte Total\tÍtems\tEstado\tCAE\n");

        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");

        if (reporte != null) {
            for (FacturaReporteDTO dto : reporte) {
                String nro = dto.getNumeroFactura() != null
                        ? String.format("00001-%08d", dto.getNumeroFactura())
                        : "Sin asignar";

                Date fechaRef = dto.getFechaEmision() != null ? dto.getFechaEmision() : dto.getFechaCreacionInterna();
                String fecha = fechaRef != null ? sdf.format(fechaRef) : "";

                String cliente = dto.getClienteDenominacion() != null ? dto.getClienteDenominacion() : "Consumidor Final";
                String condIva = dto.getCondicionIva() != null ? dto.getCondicionIva() : "";
                String pv = dto.getPuntoVentaDescripcion() != null ? dto.getPuntoVentaDescripcion() : "";
                double total = dto.getImporteTotal() != null ? dto.getImporteTotal() : 0.0;
                long items = dto.getCantidadItems() != null ? dto.getCantidadItems() : 0L;

                String estado = (dto.isEliminada() || "ANULADA".equalsIgnoreCase(dto.getEstado()))
                        ? "Eliminada"
                        : ("EMITIDA".equalsIgnoreCase(dto.getEstado()) ? "Emitida" : "Sin emitir");

                String cae = (dto.getCae() != null && !dto.getCae().trim().isEmpty())
                        ? dto.getCae().trim()
                        : "NO INFORMADA";

                sb.append(String.format(Locale.forLanguageTag("es-AR"),
                        "%d\t%s\t%s\t%s\t%s\t%s\t%.2f\t%d\t%s\t%s\n",
                        dto.getId() != null ? dto.getId() : 0L,
                        nro, fecha, cliente, condIva, pv, total, items, estado, cae));
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // =========================================================
    // MÉTODOS AUXILIARES DE DISEÑO Y FORMATO
    // =========================================================
    private Image crearLogoEmisor(PdfWriter writer, BaseColor colorPrimario) throws BadElementException {
        PdfContentByte cb = writer.getDirectContent();
        PdfTemplate template = cb.createTemplate(36, 36);

        template.setColorStroke(new BaseColor(203, 213, 225));
        template.setLineWidth(0.8f);
        template.roundRectangle(1, 1, 34, 34, 6);
        template.stroke();

        template.setColorStroke(colorPrimario);
        template.setLineWidth(1.4f);
        template.circle(18, 18, 10.5f);
        template.stroke();

        template.setColorFill(colorPrimario);
        template.circle(18, 18, 3.8f);
        template.fill();

        return Image.getInstance(template);
    }

    private void agregarTarjetaKpi(PdfPTable table, String titulo, String valor, String subtitulo,
                                   BaseColor bg, BaseColor border, Font fLabel, Font fVal, Font fSub) {
        PdfPCell card = new PdfPCell();
        card.setBackgroundColor(bg);
        card.setBorderColor(border);
        card.setBorderWidth(0.7f);
        card.setPaddingTop(8f);
        card.setPaddingBottom(8f);
        card.setPaddingLeft(12f);
        card.setPaddingRight(12f);

        Paragraph p1 = new Paragraph(titulo, fLabel);
        p1.setSpacingAfter(2f);
        card.addElement(p1);

        Paragraph p2 = new Paragraph(valor, fVal);
        p2.setSpacingAfter(2f);
        card.addElement(p2);

        card.addElement(new Paragraph(subtitulo, fSub));
        table.addCell(card);
    }

    private void agregarCeldaTabla(PdfPTable table, String texto, Font font, BaseColor bg, BaseColor border, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(texto != null ? texto : "", font));
        cell.setBackgroundColor(bg);
        cell.setBorderColor(border);
        cell.setBorderWidth(0.5f);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPaddingTop(6f);
        cell.setPaddingBottom(6f);
        cell.setPaddingLeft(5f);
        cell.setPaddingRight(5f);
        table.addCell(cell);
    }

    private String formatearMoneda(double valor) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.forLanguageTag("es-AR"));
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        DecimalFormat df = new DecimalFormat("#,##0.00", symbols);
        return "$ " + df.format(valor);
    }

    // =========================================================
    // PIE DE PÁGINA AUTOMÁTICO ("Página X de Y")
    // =========================================================
    private static class PaginacionFooterHelper extends PdfPageEventHelper {
        private PdfTemplate totalPaginasTemplate;
        private BaseFont baseFont;

        @Override
        public void onOpenDocument(PdfWriter writer, Document document) {
            totalPaginasTemplate = writer.getDirectContent().createTemplate(30, 16);
            try {
                baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            float y = document.bottom() - 18f;

            // Línea superior del pie
            cb.setColorStroke(new BaseColor(203, 213, 225));
            cb.setLineWidth(0.6f);
            cb.moveTo(document.left(), y + 11f);
            cb.lineTo(document.right(), y + 11f);
            cb.stroke();

            cb.beginText();
            cb.setFontAndSize(baseFont, 8);
            cb.setColorFill(new BaseColor(100, 116, 139));

            // Izquierda
            cb.setTextMatrix(document.left(), y);
            cb.showText("FacturAR · Reporte de Gestión Comercial y Facturación Electrónica (ARCA)");

            // Derecha ("Página X de Y")
            String textoPag = "Página " + writer.getPageNumber() + " de ";
            float anchoTexto = baseFont.getWidthPoint(textoPag, 8);
            float xDerecha = document.right() - anchoTexto - 18f;
            cb.setTextMatrix(xDerecha, y);
            cb.showText(textoPag);
            cb.endText();

            cb.addTemplate(totalPaginasTemplate, xDerecha + anchoTexto, y);
        }

        @Override
        public void onCloseDocument(PdfWriter writer, Document document) {
            totalPaginasTemplate.beginText();
            totalPaginasTemplate.setFontAndSize(baseFont, 8);
            totalPaginasTemplate.setColorFill(new BaseColor(100, 116, 139));
            totalPaginasTemplate.showText(String.valueOf(writer.getPageNumber() - 1));
            totalPaginasTemplate.endText();
        }
    }
}