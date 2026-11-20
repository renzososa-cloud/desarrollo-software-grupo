package ar.edu.utn.controlador;

import ar.edu.utn.modelo.FacturaVenta;
import ar.edu.utn.modelo.FacturaVentaDetalle;
import ar.edu.utn.repositorio.FacturaVentaRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Date;
import java.util.Locale;

@RestController
@RequestMapping("/api/facturas")
@CrossOrigin(origins = "*")
public class FacturaPdfController {

    private final FacturaVentaRepository repository;

    // Datos del emisor (Homologación ARCA)
    private static final String EMISOR_NOMBRE = "FacturAR";
    private static final String EMISOR_RAZON_SOCIAL = "FacturAR S.R.L.";
    private static final String EMISOR_DOMICILIO = "Av. San Martín 1250 - Mendoza";
    private static final String EMISOR_CONDICION_IVA = "RESPONSABLE MONOTRIBUTO";
    private static final String EMISOR_TELEFONO = "2615000000";
    private static final String EMISOR_CUIT = "23405971674";
    private static final String EMISOR_IIBB = "No contribuyente (TEST)";
    private static final String EMISOR_INICIO_ACT = "01/01/2026 (TEST)";

    public FacturaPdfController(FacturaVentaRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        FacturaVenta factura = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));

        try {
            // Margen inferior de 225 pt para reservar el espacio del pie fiscal fijo
            float margenLateral = 28f;
            float margenSuperior = 28f;
            float margenInferiorPagina = 28f;
            float reservaPieFiscal = 225f;

            Document document = new Document(
                    PageSize.A4,
                    margenLateral,
                    margenLateral,
                    margenSuperior,
                    reservaPieFiscal
            );
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            float anchoUtil = document.right() - document.left();

            // Paleta y tipografías
            BaseColor grisCabecera = new BaseColor(217, 217, 217);
            BaseColor grisBorde = new BaseColor(60, 60, 60);
            BaseColor azulMarca = new BaseColor(14, 165, 233);
            BaseColor azulOscuro = new BaseColor(15, 23, 42);
            BaseColor rojoBorrador = new BaseColor(185, 28, 28);

            Font fontOriginal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.BLACK);
            Font fontBrand = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, azulOscuro);
            Font fontLetraC = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, BaseColor.BLACK);
            Font fontCodComp = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, BaseColor.BLACK);
            Font fontFacturaTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
            Font fontNroComp = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11.5f, BaseColor.BLACK);
            Font fontLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, BaseColor.BLACK);
            Font fontValue = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, BaseColor.BLACK);
            Font fontTh = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, BaseColor.BLACK);
            Font fontTd = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, BaseColor.BLACK);
            Font fontTotalBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, BaseColor.BLACK);
            Font fontArcaLogo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, azulOscuro);
            Font fontArcaSub = FontFactory.getFont(FontFactory.HELVETICA_BOLDOBLIQUE, 9, BaseColor.BLACK);
            Font fontLegal = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 6.8f, new BaseColor(75, 85, 99));

            boolean esEmitida = factura.getCae() != null && !factura.getCae().trim().isEmpty();
            int ptoVta = factura.getPuntoVenta() != null ? factura.getPuntoVenta().getNumero() : 1;

            String nroComprobante = factura.getNumero() != null
                    ? String.format("N° %05d-%08d", ptoVta, factura.getNumero())
                    : String.format("N° %05d-BORRADOR", ptoVta);

            Date fechaRef = factura.getFechaEmision() != null ? factura.getFechaEmision() : factura.getFechaAlta();
            String fechaStr = fechaRef != null
                    ? new SimpleDateFormat("dd/MM/yyyy").format(fechaRef)
                    : "Pendiente";

            // =========================================================
            // 1. BANNER SUPERIOR: ORIGINAL / BORRADOR
            // =========================================================
            PdfPTable tablaOriginal = new PdfPTable(1);
            tablaOriginal.setWidthPercentage(100);
            PdfPCell cellOriginal = new PdfPCell(new Phrase(
                    esEmitida ? "ORIGINAL" : "BORRADOR · DOCUMENTO NO VÁLIDO COMO FACTURA",
                    esEmitida ? fontOriginal : FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, rojoBorrador)
            ));
            cellOriginal.setHorizontalAlignment(Element.ALIGN_CENTER);
            cellOriginal.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cellOriginal.setPadding(5f);
            cellOriginal.setBorderColor(grisBorde);
            cellOriginal.setBorderWidth(0.8f);
            tablaOriginal.addCell(cellOriginal);
            document.add(tablaOriginal);

            // =========================================================
            // 2. ENCABEZADO FISCAL (EMISOR | LETRA C | DATOS FACTURA)
            // =========================================================
            PdfPTable tablaHeader = new PdfPTable(3);
            tablaHeader.setWidthPercentage(100);
            tablaHeader.setWidths(new float[]{4.4f, 1.2f, 4.4f});

            // --- Columna Izquierda: Logo + Datos del Emisor ---
            PdfPCell cellEmisor = new PdfPCell();
            cellEmisor.setBorderColor(grisBorde);
            cellEmisor.setBorderWidthLeft(0.8f);
            cellEmisor.setBorderWidthBottom(0.8f);
            cellEmisor.setBorderWidthTop(0f);
            cellEmisor.setBorderWidthRight(0f);
            cellEmisor.setPadding(8f);

            PdfPTable tablaLogoTitulo = new PdfPTable(2);
            tablaLogoTitulo.setWidthPercentage(100);
            tablaLogoTitulo.setWidths(new float[]{1.2f, 3.8f});

            PdfPCell cellLogo = new PdfPCell(crearLogoEmisor(writer, azulMarca));
            cellLogo.setBorder(Rectangle.NO_BORDER);
            cellLogo.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cellLogo.setPadding(2f);
            tablaLogoTitulo.addCell(cellLogo);

            PdfPCell cellNombreEmisor = new PdfPCell(new Phrase(EMISOR_NOMBRE, fontBrand));
            cellNombreEmisor.setBorder(Rectangle.NO_BORDER);
            cellNombreEmisor.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cellNombreEmisor.setPaddingLeft(6f);
            tablaLogoTitulo.addCell(cellNombreEmisor);

            cellEmisor.addElement(tablaLogoTitulo);

            PdfPTable datosEmisorGrid = new PdfPTable(2);
            datosEmisorGrid.setWidthPercentage(100);
            datosEmisorGrid.setWidths(new float[]{1.85f, 2.55f});
            datosEmisorGrid.setSpacingBefore(6f);

            agregarFilaClaveValor(datosEmisorGrid, "Razón social:", EMISOR_RAZON_SOCIAL, fontLabel, fontValue);
            agregarFilaClaveValor(datosEmisorGrid, "Domicilio comercial:", EMISOR_DOMICILIO, fontLabel, fontValue);
            agregarFilaClaveValor(datosEmisorGrid, "Condición frente al IVA:", EMISOR_CONDICION_IVA, fontLabel, fontValue);
            agregarFilaClaveValor(datosEmisorGrid, "Teléfono:", EMISOR_TELEFONO, fontLabel, fontValue);
            cellEmisor.addElement(datosEmisorGrid);

            tablaHeader.addCell(cellEmisor);

            // --- Columna Central: Recuadro "C / Código N° 011" + línea vertical ---
            PdfPCell cellCentro = new PdfPCell();
            cellCentro.setBorder(Rectangle.NO_BORDER);
            cellCentro.setPadding(0f);

            PdfPTable tablaCentroInterna = new PdfPTable(1);
            tablaCentroInterna.setWidthPercentage(100);

            Paragraph pLetra = new Paragraph();
            pLetra.setAlignment(Element.ALIGN_CENTER);
            pLetra.add(new Chunk("C\n", fontLetraC));
            pLetra.add(new Chunk("Código N° 011", fontCodComp));

            PdfPCell cellLetraC = new PdfPCell(pLetra);
            cellLetraC.setHorizontalAlignment(Element.ALIGN_CENTER);
            cellLetraC.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cellLetraC.setPaddingTop(4f);
            cellLetraC.setPaddingBottom(7f);
            cellLetraC.setBorderColor(grisBorde);
            cellLetraC.setBorderWidthLeft(0.8f);
            cellLetraC.setBorderWidthRight(0.8f);
            cellLetraC.setBorderWidthBottom(0.8f);
            cellLetraC.setBorderWidthTop(0f);
            tablaCentroInterna.addCell(cellLetraC);

            PdfPTable lineaDivisoria = new PdfPTable(2);
            lineaDivisoria.setWidthPercentage(100);
            PdfPCell mitadIzq = new PdfPCell(new Phrase(" "));
            mitadIzq.setFixedHeight(68f);
            mitadIzq.setBorderColor(grisBorde);
            mitadIzq.setBorderWidthTop(0f);
            mitadIzq.setBorderWidthLeft(0f);
            mitadIzq.setBorderWidthRight(0.8f);
            mitadIzq.setBorderWidthBottom(0.8f);

            PdfPCell mitadDer = new PdfPCell(new Phrase(" "));
            mitadDer.setFixedHeight(68f);
            mitadDer.setBorderColor(grisBorde);
            mitadDer.setBorderWidthTop(0f);
            mitadDer.setBorderWidthLeft(0f);
            mitadDer.setBorderWidthRight(0f);
            mitadDer.setBorderWidthBottom(0.8f);

            lineaDivisoria.addCell(mitadIzq);
            lineaDivisoria.addCell(mitadDer);

            PdfPCell cellLineaWrap = new PdfPCell(lineaDivisoria);
            cellLineaWrap.setBorder(Rectangle.NO_BORDER);
            cellLineaWrap.setPadding(0f);
            tablaCentroInterna.addCell(cellLineaWrap);

            cellCentro.addElement(tablaCentroInterna);
            tablaHeader.addCell(cellCentro);

            // --- Columna Derecha: FACTURA + N° + Datos Fiscales ---
            PdfPCell cellComprobante = new PdfPCell();
            cellComprobante.setBorderColor(grisBorde);
            cellComprobante.setBorderWidthRight(0.8f);
            cellComprobante.setBorderWidthBottom(0.8f);
            cellComprobante.setBorderWidthTop(0f);
            cellComprobante.setBorderWidthLeft(0f);
            cellComprobante.setPaddingTop(8f);
            cellComprobante.setPaddingBottom(8f);
            cellComprobante.setPaddingLeft(14f);
            cellComprobante.setPaddingRight(8f);

            Paragraph pFact = new Paragraph("FACTURA", fontFacturaTitulo);
            pFact.setSpacingAfter(2f);
            cellComprobante.addElement(pFact);

            Paragraph pNro = new Paragraph(nroComprobante, fontNroComp);
            pNro.setSpacingAfter(8f);
            cellComprobante.addElement(pNro);

            PdfPTable datosCompGrid = new PdfPTable(2);
            datosCompGrid.setWidthPercentage(100);
            datosCompGrid.setWidths(new float[]{1.9f, 2.3f});

            agregarFilaClaveValor(datosCompGrid, "Fecha de emisión:", fechaStr, fontLabel, fontValue);
            agregarFilaClaveValor(datosCompGrid, "CUIT:", EMISOR_CUIT, fontLabel, fontValue);
            agregarFilaClaveValor(datosCompGrid, "Ingresos Brutos:", EMISOR_IIBB, fontLabel, fontValue);
            agregarFilaClaveValor(datosCompGrid, "Inicio de actividades:", EMISOR_INICIO_ACT, fontLabel, fontValue);
            cellComprobante.addElement(datosCompGrid);

            tablaHeader.addCell(cellComprobante);
            document.add(tablaHeader);

            // =========================================================
            // 3. RECUADRO DE DATOS DEL CLIENTE / RECEPTOR
            // =========================================================
            String cliNombre = "Consumidor Final";
            String cliCuit = "—";
            String cliTelefono = "—";
            String cliDomicilio = "—";

            if (factura.getCliente() != null) {
                Object cli = factura.getCliente();
                if (factura.getCliente().getDenominacion() != null) {
                    cliNombre = factura.getCliente().getDenominacion();
                }
                if (factura.getCliente().getCuitCuil() != null && !factura.getCliente().getCuitCuil().isBlank()) {
                    cliCuit = factura.getCliente().getCuitCuil();
                }
                String tel = obtenerPropiedadTexto(cli, "getTelefono", "getCelular");
                if (!tel.isEmpty()) cliTelefono = tel;

                String dom = obtenerPropiedadTexto(cli, "getDomicilio");
                if (dom.isEmpty()) {
                    String calle = obtenerPropiedadTexto(cli, "getCalle");
                    String nro = obtenerPropiedadTexto(cli, "getNumero");
                    dom = (calle + " " + nro).trim();
                }
                if (!dom.isEmpty()) cliDomicilio = dom;
            }

            String cliCondIva = factura.getCondicionIva() != null
                    ? factura.getCondicionIva().getDenominacion()
                    : "Consumidor Final";

            PdfPTable tablaCliente = new PdfPTable(4);
            tablaCliente.setWidthPercentage(100);
            tablaCliente.setWidths(new float[]{1.75f, 2.45f, 2.45f, 3.35f});

            agregarCeldaSinBorde(tablaCliente, "CUIT:", fontLabel);
            agregarCeldaSinBorde(tablaCliente, cliCuit, fontValue);
            agregarCeldaSinBorde(tablaCliente, "Apellido y nombre / Razón social:", fontLabel);
            agregarCeldaSinBorde(tablaCliente, cliNombre, fontValue);

            agregarCeldaSinBorde(tablaCliente, "Condición frente al IVA:", fontLabel);
            agregarCeldaSinBorde(tablaCliente, cliCondIva, fontValue);
            agregarCeldaSinBorde(tablaCliente, "Teléfono:", fontLabel);
            agregarCeldaSinBorde(tablaCliente, cliTelefono, fontValue);

            agregarCeldaSinBorde(tablaCliente, "Condición de venta:", fontLabel);
            agregarCeldaSinBorde(tablaCliente, "Contado", fontValue);
            agregarCeldaSinBorde(tablaCliente, "Domicilio comercial:", fontLabel);
            agregarCeldaSinBorde(tablaCliente, cliDomicilio, fontValue);

            PdfPTable contenedorCliente = new PdfPTable(1);
            contenedorCliente.setWidthPercentage(100);
            contenedorCliente.setSpacingBefore(6f);
            PdfPCell boxCliente = new PdfPCell(tablaCliente);
            boxCliente.setBorderColor(grisBorde);
            boxCliente.setBorderWidth(0.8f);
            boxCliente.setPadding(6f);
            contenedorCliente.addCell(boxCliente);
            document.add(contenedorCliente);

            // =========================================================
            // 4. TABLA DE DETALLE DE PRODUCTOS / SERVICIOS (8 COLUMNAS)
            // =========================================================
            PdfPTable tablaItems = new PdfPTable(8);
            tablaItems.setWidthPercentage(100);
            tablaItems.setHeaderRows(1);
            tablaItems.setSpacingBefore(6f);
            tablaItems.setWidths(new float[]{1.15f, 3.05f, 0.85f, 1.05f, 1.25f, 0.80f, 1.05f, 1.30f});

            String[] columnas = {
                    "Código", "Producto/Servicio", "Cantidad", "U. de medida",
                    "Precio Unit.", "% Bonif.", "Imp. Bonif.", "Subtotal"
            };

            for (String col : columnas) {
                PdfPCell th = new PdfPCell(new Phrase(col, fontTh));
                th.setBackgroundColor(grisCabecera);
                th.setBorderColor(grisBorde);
                th.setBorderWidth(0.6f);
                th.setHorizontalAlignment(Element.ALIGN_CENTER);
                th.setVerticalAlignment(Element.ALIGN_MIDDLE);
                th.setPaddingTop(6f);
                th.setPaddingBottom(6f);
                th.setPaddingLeft(4f);
                th.setPaddingRight(4f);
                tablaItems.addCell(th);
            }

            for (FacturaVentaDetalle det : factura.getDetalles()) {
                String codigoArt = "ART-000";
                if (det.getListaPrecioArticulo() != null && det.getListaPrecioArticulo().getArticulo() != null) {
                    String codDb = det.getListaPrecioArticulo().getArticulo().getCodigo();
                    Long artId = det.getListaPrecioArticulo().getArticulo().getId();
                    codigoArt = (codDb != null && !codDb.isBlank())
                            ? codDb
                            : String.format("ART-%06d", artId != null ? artId : 0L);
                }

                double bruto = det.getPrecioUnitario() * det.getCantidad();
                double impBonif = Math.round(bruto * (det.getPorcentajeBonificacion() / 100.0) * 100.0) / 100.0;

                agregarCeldaItem(tablaItems, codigoArt, fontTd, Element.ALIGN_CENTER);
                agregarCeldaItem(tablaItems, det.getDescripcion(), fontTd, Element.ALIGN_LEFT);
                agregarCeldaItem(tablaItems, formatearCantidad(det.getCantidad()), fontTd, Element.ALIGN_RIGHT);
                agregarCeldaItem(tablaItems, "unidad", fontTd, Element.ALIGN_CENTER);
                agregarCeldaItem(tablaItems, formatearMoneda(det.getPrecioUnitario()), fontTd, Element.ALIGN_RIGHT);
                agregarCeldaItem(tablaItems, formatearPorcentaje(det.getPorcentajeBonificacion()), fontTd, Element.ALIGN_RIGHT);
                agregarCeldaItem(tablaItems, formatearMoneda(impBonif), fontTd, Element.ALIGN_RIGHT);
                agregarCeldaItem(tablaItems, formatearMoneda(det.getImporteSubtotal()), fontTd, Element.ALIGN_RIGHT);
            }

            document.add(tablaItems);

            // =========================================================
            // 5. BLOQUE TRANSPARENCIA FISCAL (LEY 27.743) Y TOTALES
            // =========================================================
            PdfPTable tablaTotales = new PdfPTable(2);
            tablaTotales.setTotalWidth(anchoUtil);
            tablaTotales.setLockedWidth(true);
            tablaTotales.setWidths(new float[]{5.8f, 4.2f});

            // Izquierda: Régimen de Transparencia Fiscal
            PdfPCell cellTransparencia = new PdfPCell();
            cellTransparencia.setBorderColor(grisBorde);
            cellTransparencia.setBorderWidth(0.8f);
            cellTransparencia.setPadding(10f);
            cellTransparencia.setVerticalAlignment(Element.ALIGN_BOTTOM);

            Paragraph pLey = new Paragraph("Régimen de Transparencia Fiscal al Consumidor (Ley 27.743)", fontLabel);
            pLey.setSpacingBefore(14f);
            pLey.setSpacingAfter(8f);
            cellTransparencia.addElement(pLey);

            PdfPTable gridImpuestos = new PdfPTable(2);
            gridImpuestos.setWidthPercentage(75);
            gridImpuestos.setHorizontalAlignment(Element.ALIGN_LEFT);
            gridImpuestos.setWidths(new float[]{3.2f, 1.3f});

            agregarFilaClaveValor(gridImpuestos, "IVA contenido", formatearMoneda(0.0), fontLabel, fontValue);
            agregarFilaClaveValor(gridImpuestos, "Otros Impuestos Nacionales Indirectos", formatearMoneda(0.0), fontLabel, fontValue);
            cellTransparencia.addElement(gridImpuestos);

            tablaTotales.addCell(cellTransparencia);

            // Derecha: Moneda + Subtotal + Importe Total
            PdfPCell cellImportes = new PdfPCell();
            cellImportes.setBorderColor(grisBorde);
            cellImportes.setBorderWidth(0.8f);
            cellImportes.setPadding(0f);

            String monedaCod = (factura.getTipoMoneda() != null
                    && factura.getTipoMoneda().getDenominacion() != null
                    && factura.getTipoMoneda().getDenominacion().toUpperCase().contains("DÓLAR"))
                    ? "USD" : "PES";

            PdfPCell cellMoneda = new PdfPCell(new Phrase("Moneda: " + monedaCod + "     Cotización: 1,000000", fontValue));
            cellMoneda.setBorderColor(grisBorde);
            cellMoneda.setBorderWidthTop(0f);
            cellMoneda.setBorderWidthLeft(0f);
            cellMoneda.setBorderWidthRight(0f);
            cellMoneda.setBorderWidthBottom(0.6f);
            cellMoneda.setPaddingTop(8f);
            cellMoneda.setPaddingBottom(6f);
            cellMoneda.setPaddingLeft(10f);
            cellMoneda.setPaddingRight(10f);

            PdfPTable tablaDerInterna = new PdfPTable(1);
            tablaDerInterna.setWidthPercentage(100);
            tablaDerInterna.addCell(cellMoneda);

            PdfPTable gridMontos = new PdfPTable(3);
            gridMontos.setWidthPercentage(100);
            gridMontos.setWidths(new float[]{2.4f, 0.4f, 1.4f});

            String importeFormateado = formatearNumero(factura.getImporteTotal());
            agregarFilaTotal(gridMontos, "Subtotal", "$", importeFormateado, fontTotalBold);
            agregarFilaTotal(gridMontos, "Otros tributos", "$", "0,00", fontTotalBold);
            agregarFilaTotal(gridMontos, "Importe total", "$", importeFormateado, fontTotalBold);

            PdfPCell cellMontosWrap = new PdfPCell(gridMontos);
            cellMontosWrap.setBorder(Rectangle.NO_BORDER);
            cellMontosWrap.setPadding(8f);
            tablaDerInterna.addCell(cellMontosWrap);

            cellImportes.addElement(tablaDerInterna);
            tablaTotales.addCell(cellImportes);

            // =========================================================
            // 6. PIE FISCAL ARCA (CÓDIGO QR + CAE + VENCIMIENTO)
            // =========================================================
            PdfPTable tablaPie = new PdfPTable(4);
            tablaPie.setTotalWidth(anchoUtil);
            tablaPie.setLockedWidth(true);
            tablaPie.setWidths(new float[]{1.45f, 4.35f, 1.20f, 3.00f});

            // Celda 1: Código QR ARCA
            PdfPCell cellQr = new PdfPCell();
            cellQr.setBorderColor(grisBorde);
            cellQr.setBorderWidthTop(0.8f);
            cellQr.setBorderWidthLeft(0.8f);
            cellQr.setBorderWidthBottom(0.8f);
            cellQr.setBorderWidthRight(0f);
            cellQr.setPadding(7f);
            cellQr.setHorizontalAlignment(Element.ALIGN_CENTER);
            cellQr.setVerticalAlignment(Element.ALIGN_MIDDLE);

            if (esEmitida) {
                String urlQr = construirUrlQrArca(factura, ptoVta);
                BarcodeQRCode qrCode = new BarcodeQRCode(urlQr, 130, 130, null);
                Image qrImg = qrCode.getImage();
                qrImg.scaleAbsolute(64f, 64f);
                cellQr.addElement(qrImg);
            } else {
                Paragraph pSinQr = new Paragraph("SIN\nCAE", fontCodComp);
                pSinQr.setAlignment(Element.ALIGN_CENTER);
                cellQr.addElement(pSinQr);
            }
            tablaPie.addCell(cellQr);

            // Celda 2: Logo ARCA + Leyenda legal
            PdfPCell cellArca = new PdfPCell();
            cellArca.setBorderColor(grisBorde);
            cellArca.setBorderWidthTop(0.8f);
            cellArca.setBorderWidthBottom(0.8f);
            cellArca.setBorderWidthLeft(0f);
            cellArca.setBorderWidthRight(0f);
            cellArca.setPaddingTop(8f);
            cellArca.setPaddingBottom(8f);
            cellArca.setPaddingLeft(4f);
            cellArca.setVerticalAlignment(Element.ALIGN_MIDDLE);

            Paragraph pArca = new Paragraph("ARCA", fontArcaLogo);
            pArca.setSpacingAfter(2f);
            cellArca.addElement(pArca);

            Paragraph pCompAut = new Paragraph(
                    esEmitida ? "Comprobante Autorizado" : "Borrador pendiente de autorización",
                    fontArcaSub
            );
            pCompAut.setSpacingAfter(2f);
            cellArca.addElement(pCompAut);

            Paragraph pDisclaimer = new Paragraph(
                    "Esta Administración Federal no se responsabiliza por los datos ingresados en el detalle de la operación.",
                    fontLegal
            );
            cellArca.addElement(pDisclaimer);
            tablaPie.addCell(cellArca);

            // Celda 3: Paginación
            int numPagActual = writer.getPageNumber();
            PdfPCell cellPag = new PdfPCell(new Phrase("Pág. " + numPagActual + "/" + numPagActual, fontLabel));
            cellPag.setBorderColor(grisBorde);
            cellPag.setBorderWidthTop(0.8f);
            cellPag.setBorderWidthBottom(0.8f);
            cellPag.setBorderWidthLeft(0f);
            cellPag.setBorderWidthRight(0f);
            cellPag.setPaddingTop(10f);
            cellPag.setHorizontalAlignment(Element.ALIGN_CENTER);
            cellPag.setVerticalAlignment(Element.ALIGN_TOP);
            tablaPie.addCell(cellPag);

            // Celda 4: CAE N° y Fecha de Vencimiento
            PdfPCell cellCae = new PdfPCell();
            cellCae.setBorderColor(grisBorde);
            cellCae.setBorderWidthTop(0.8f);
            cellCae.setBorderWidthBottom(0.8f);
            cellCae.setBorderWidthRight(0.8f);
            cellCae.setBorderWidthLeft(0f);
            cellCae.setPaddingTop(10f);
            cellCae.setPaddingRight(10f);
            cellCae.setVerticalAlignment(Element.ALIGN_TOP);

            if (esEmitida) {
                String vtoCae = factura.getCaeFechaVencimiento() != null
                        ? new SimpleDateFormat("dd/MM/yyyy").format(factura.getCaeFechaVencimiento())
                        : "—";

                Paragraph pCaeNro = new Paragraph();
                pCaeNro.setAlignment(Element.ALIGN_RIGHT);
                pCaeNro.setSpacingAfter(5f);
                pCaeNro.add(new Chunk("CAE N°: ", fontLabel));
                pCaeNro.add(new Chunk(factura.getCae(), fontValue));
                cellCae.addElement(pCaeNro);

                Paragraph pCaeVto = new Paragraph();
                pCaeVto.setAlignment(Element.ALIGN_RIGHT);
                pCaeVto.add(new Chunk("Fecha de Vto. de CAE: ", fontLabel));
                pCaeVto.add(new Chunk(vtoCae, fontValue));
                cellCae.addElement(pCaeVto);
            } else {
                Paragraph pNoValido = new Paragraph("COMPROBANTE SIN EMITIR",
                        FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, rojoBorrador));
                pNoValido.setAlignment(Element.ALIGN_RIGHT);
                cellCae.addElement(pNoValido);
            }

            tablaPie.addCell(cellCae);

            // =========================================================
            // 7. POSICIONAR AMBOS BLOQUES EN EL FONDO DE LA PÁGINA
            // =========================================================
            PdfPTable bloqueInferior = new PdfPTable(1);
            bloqueInferior.setTotalWidth(anchoUtil);
            bloqueInferior.setLockedWidth(true);

            PdfPCell wrapTotales = new PdfPCell(tablaTotales);
            wrapTotales.setBorder(Rectangle.NO_BORDER);
            wrapTotales.setPadding(0f);
            wrapTotales.setPaddingBottom(6f);
            bloqueInferior.addCell(wrapTotales);

            PdfPCell wrapPie = new PdfPCell(tablaPie);
            wrapPie.setBorder(Rectangle.NO_BORDER);
            wrapPie.setPadding(0f);
            bloqueInferior.addCell(wrapPie);

            float alturaBloqueInferior = bloqueInferior.getTotalHeight();
            float yInicioSuperior = margenInferiorPagina + alturaBloqueInferior;

            bloqueInferior.writeSelectedRows(
                    0,
                    -1,
                    document.left(),
                    yInicioSuperior,
                    writer.getDirectContent()
            );

            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String nombreArchivo = factura.getNumero() != null
                    ? String.format("Factura_C_%05d-%08d.pdf", ptoVta, factura.getNumero())
                    : "Borrador_Factura_" + factura.getId() + ".pdf";
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nombreArchivo + "\"");

            return new ResponseEntity<>(out.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // =========================================================
    // MÉTODOS AUXILIARES DE DISEÑO Y FORMATO
    // =========================================================

    private Image crearLogoEmisor(PdfWriter writer, BaseColor colorPrimario) throws BadElementException {
        PdfContentByte cb = writer.getDirectContent();
        PdfTemplate template = cb.createTemplate(44, 44);

        template.setColorStroke(new BaseColor(203, 213, 225));
        template.setLineWidth(0.8f);
        template.roundRectangle(1, 1, 42, 42, 6);
        template.stroke();

        template.setColorStroke(colorPrimario);
        template.setLineWidth(1.5f);
        template.circle(22, 22, 13);
        template.stroke();

        template.setColorFill(colorPrimario);
        template.circle(22, 22, 4.5f);
        template.fill();

        return Image.getInstance(template);
    }

    private String construirUrlQrArca(FacturaVenta factura, int ptoVta) {
        String fechaIso = factura.getFechaEmision() != null
                ? new SimpleDateFormat("yyyy-MM-dd").format(factura.getFechaEmision())
                : new SimpleDateFormat("yyyy-MM-dd").format(new Date());

        long nroCmp = factura.getNumero() != null ? factura.getNumero() : 0L;
        int tipoDocRec = 99;
        long nroDocRec = 0L;

        if (factura.getCliente() != null && factura.getCliente().getCuitCuil() != null) {
            String digitos = factura.getCliente().getCuitCuil().replaceAll("\\D", "");
            if (!digitos.isEmpty()) {
                nroDocRec = Long.parseLong(digitos);
                tipoDocRec = digitos.length() == 11 ? 80 : 96;
            }
        }

        String json = String.format(Locale.US,
                "{\"ver\":1,\"fecha\":\"%s\",\"cuit\":%s,\"ptoVta\":%d,\"tipoCmp\":11,\"nroCmp\":%d," +
                        "\"importe\":%.2f,\"moneda\":\"PES\",\"ctz\":1,\"tipoDocRec\":%d,\"nroDocRec\":%d," +
                        "\"tipoCodAut\":\"E\",\"codAut\":%s}",
                fechaIso, EMISOR_CUIT, ptoVta, nroCmp, factura.getImporteTotal(),
                tipoDocRec, nroDocRec, factura.getCae().trim()
        );

        String base64 = Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        return "https://www.arca.gob.ar/fe/qr/?p=" + base64;
    }

    private void agregarFilaClaveValor(PdfPTable table, String clave, String valor, Font fClave, Font fValor) {
        PdfPCell c1 = new PdfPCell(new Phrase(clave, fClave));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setPaddingTop(2f);
        c1.setPaddingBottom(2f);
        c1.setPaddingLeft(0f);

        PdfPCell c2 = new PdfPCell(new Phrase(valor, fValor));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setPaddingTop(2f);
        c2.setPaddingBottom(2f);

        table.addCell(c1);
        table.addCell(c2);
    }

    private void agregarCeldaSinBorde(PdfPTable table, String texto, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingTop(3f);
        cell.setPaddingBottom(3f);
        cell.setPaddingLeft(4f);
        table.addCell(cell);
    }

    private void agregarCeldaItem(PdfPTable table, String texto, Font font, int alineacion) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(alineacion);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPaddingTop(6f);
        cell.setPaddingBottom(6f);
        cell.setPaddingLeft(5f);
        cell.setPaddingRight(5f);
        table.addCell(cell);
    }

    private void agregarFilaTotal(PdfPTable table, String etiqueta, String signo, String monto, Font font) {
        PdfPCell cLabel = new PdfPCell(new Phrase(etiqueta, font));
        cLabel.setBorder(Rectangle.NO_BORDER);
        cLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cLabel.setPaddingTop(3f);
        cLabel.setPaddingBottom(3f);

        PdfPCell cSigno = new PdfPCell(new Phrase(signo, font));
        cSigno.setBorder(Rectangle.NO_BORDER);
        cSigno.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cSigno.setPaddingTop(3f);
        cSigno.setPaddingBottom(3f);

        PdfPCell cMonto = new PdfPCell(new Phrase(monto, font));
        cMonto.setBorder(Rectangle.NO_BORDER);
        cMonto.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cMonto.setPaddingTop(3f);
        cMonto.setPaddingBottom(3f);

        table.addCell(cLabel);
        table.addCell(cSigno);
        table.addCell(cMonto);
    }

    private String formatearMoneda(double valor) {
        return "$ " + formatearNumero(valor);
    }

    private String formatearNumero(double valor) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.forLanguageTag("es-AR"));
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        DecimalFormat df = new DecimalFormat("#,##0.00", symbols);
        return df.format(valor);
    }

    private String formatearCantidad(double cantidad) {
        if (cantidad == Math.floor(cantidad)) {
            return String.valueOf((long) cantidad);
        }
        return formatearNumero(cantidad);
    }

    private String formatearPorcentaje(double porcentaje) {
        if (porcentaje == Math.floor(porcentaje)) {
            return String.format("%d %%", (long) porcentaje);
        }
        return formatearNumero(porcentaje) + " %";
    }

    private String obtenerPropiedadTexto(Object obj, String... nombresMetodos) {
        if (obj == null) return "";
        for (String nombre : nombresMetodos) {
            try {
                Method m = obj.getClass().getMethod(nombre);
                Object res = m.invoke(obj);
                if (res != null && !res.toString().trim().isEmpty()) {
                    return res.toString().trim();
                }
            } catch (Exception ignored) {
            }
        }
        return "";
    }
}