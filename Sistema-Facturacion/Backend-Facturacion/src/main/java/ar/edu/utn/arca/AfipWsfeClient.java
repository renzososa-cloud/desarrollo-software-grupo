package ar.edu.utn.arca;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import ar.gov.afip.wsfe.ArrayOfFECAEDetRequest;
import ar.gov.afip.wsfe.FEAuthRequest;
import ar.gov.afip.wsfe.FECAECabRequest;
import ar.gov.afip.wsfe.FECAEDetRequest;
import ar.gov.afip.wsfe.FECAERequest;
import ar.gov.afip.wsfe.FECAEResponse;
import ar.gov.afip.wsfe.Service;
import ar.gov.afip.wsfe.ServiceSoap;

public class AfipWsfeClient {

    private static final String URL_WSFE = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx";

    public static int obtenerUltimoComprobante(String token, String sign, long cuit, int ptoVta, int cbteTipo) throws Exception {
        String soapXml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
                "<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
                "<soap:Body>" +
                "  <FECompUltimoAutorizado xmlns=\"http://ar.gov.afip.dif.FEV1/\">" +
                "<Auth><Token>" + token + "</Token><Sign>" + sign + "</Sign><Cuit>" + cuit + "</Cuit></Auth>" +
                "<PtoVta>" + ptoVta + "</PtoVta>" +
                "<CbteTipo>" + cbteTipo + "</CbteTipo>" +
                "  </FECompUltimoAutorizado>" +
                "</soap:Body></soap:Envelope>";

        String response = enviarSoap(URL_WSFE, soapXml, "http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado");
        String nro = response.substring(response.indexOf("<CbteNro>") + 9, response.indexOf("</CbteNro>"));
        return Integer.parseInt(nro);
    }

    public static FECAEResponse solicitarCae(String token, String sign, long cuit, int ptoVta, int cbteNro, double importeTotal, int condicionIvaReceptor) throws Exception {
        System.out.println("-> [Rastreo] 1. Iniciando solicitarCae...");
        try {
            System.out.println("-> [Rastreo] 2. Instanciando Service (Leyendo WSDL)... ¡Aquí suele fallar!");
            Service service = new Service();

            System.out.println("-> [Rastreo] 3. Obteniendo puerto SOAP...");
            ServiceSoap port = service.getServiceSoap();

            System.out.println("-> [Rastreo] 4. Configurando petición...");
            FEAuthRequest auth = new FEAuthRequest();
            auth.setToken(token.trim());
            auth.setSign(sign.trim());
            auth.setCuit(cuit);

            FECAERequest req = new FECAERequest();
            FECAECabRequest cab = new FECAECabRequest();
            cab.setCantReg(1);
            cab.setPtoVta(ptoVta);
            cab.setCbteTipo(11); // Factura C
            req.setFeCabReq(cab);

            FECAEDetRequest det = new FECAEDetRequest();
            det.setConcepto(1); // 1 = Productos
            det.setDocTipo(99); // 99 = Consumidor Final
            det.setDocNro(0);
            det.setCbteDesde(cbteNro);
            det.setCbteHasta(cbteNro);
            det.setCbteFch(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")));

            det.setImpTotal(importeTotal);
            det.setImpTotConc(0.00);
            det.setImpNeto(importeTotal);
            det.setImpOpEx(0.00);
            det.setImpTrib(0.00);
            det.setImpIVA(0.00);
            det.setMonId("PES");
            det.setMonCotiz(1.0);
            det.setCondicionIVAReceptorId(condicionIvaReceptor);

            ArrayOfFECAEDetRequest detArray = new ArrayOfFECAEDetRequest();
            detArray.getFECAEDetRequest().add(det);
            req.setFeDetReq(detArray);

            System.out.println("-> [Rastreo] 5. Disparando petición a AFIP...");
            FECAEResponse response = port.fecaeSolicitar(auth, req);

            System.out.println("-> [Rastreo] 6. ¡Respuesta exitosa de AFIP!");
            return response;

        } catch (Throwable t) {
            // Este bloque forzará a que cualquier error oculto se imprima en ROJO
            System.err.println("-> [ERROR CRÍTICO EN SOLICITAR CAE]: " + t.getMessage());
            t.printStackTrace();
            throw new Exception("Error al invocar AFIP: " + t.getMessage(), t);
        }
    }

    private static String enviarSoap(String endpointUrl, String soapXml, String soapAction) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(endpointUrl).openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "text/xml; charset=utf-8");
        if (soapAction != null && !soapAction.isEmpty()) conn.setRequestProperty("SOAPAction", soapAction);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(soapXml.getBytes(StandardCharsets.UTF_8));
        }

        InputStream is = (conn.getResponseCode() >= 400) ? conn.getErrorStream() : conn.getInputStream();
        StringBuilder response = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) response.append(line.trim());
        }
        return response.toString();
    }
}