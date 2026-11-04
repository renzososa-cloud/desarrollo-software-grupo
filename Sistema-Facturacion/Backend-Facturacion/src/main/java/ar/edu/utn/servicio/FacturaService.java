package ar.edu.utn.servicio;

import ar.edu.utn.dto.FacturaDetalleRequestDTO;
import ar.edu.utn.dto.FacturaReporteDTO;
import ar.edu.utn.dto.FacturaRequestDTO;
import ar.edu.utn.excepciones.RecursoNoEncontradoException;
import ar.edu.utn.modelo.*;
import ar.edu.utn.repositorio.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class FacturaService {

    private final FacturaVentaRepository facturaRepository;
    private final PuntoVentaRepository puntoVentaRepository;
    private final ClienteRepository clienteRepository;
    private final CondicionIvaRepository condicionIvaRepository;
    private final TipoMonedaRepository tipoMonedaRepository;
    private final ListaPrecioArticuloRepository listaPrecioArticuloRepository;

    public FacturaService(FacturaVentaRepository facturaRepository, PuntoVentaRepository puntoVentaRepository,
                          ClienteRepository clienteRepository, CondicionIvaRepository condicionIvaRepository,
                          TipoMonedaRepository tipoMonedaRepository, ListaPrecioArticuloRepository listaPrecioArticuloRepository) {
        this.facturaRepository = facturaRepository;
        this.puntoVentaRepository = puntoVentaRepository;
        this.clienteRepository = clienteRepository;
        this.condicionIvaRepository = condicionIvaRepository;
        this.tipoMonedaRepository = tipoMonedaRepository;
        this.listaPrecioArticuloRepository = listaPrecioArticuloRepository;
    }

    @Transactional
    public FacturaVenta crear(FacturaRequestDTO requestDTO) {
        PuntoVenta puntoVenta = puntoVentaRepository.findById(requestDTO.getPuntoVentaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Punto de venta no encontrado con ID: " + requestDTO.getPuntoVentaId()));

        CondicionIva condicionIva = condicionIvaRepository.findById(requestDTO.getCondicionIvaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Condición de IVA no encontrada con ID: " + requestDTO.getCondicionIvaId()));

        TipoMoneda tipoMoneda = tipoMonedaRepository.findById(requestDTO.getTipoMonedaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Tipo de moneda no encontrado con ID: " + requestDTO.getTipoMonedaId()));

        Cliente cliente = null;
        if (requestDTO.getClienteId() != null) {
            cliente = clienteRepository.findById(requestDTO.getClienteId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con ID: " + requestDTO.getClienteId()));
        }

        FacturaVenta factura = new FacturaVenta();
        factura.setNumero(System.currentTimeMillis() % 100000);
        factura.setFechaEmision(requestDTO.getFechaEmision() != null ? requestDTO.getFechaEmision() : new Date());
        factura.setPuntoVenta(puntoVenta);
        factura.setCondicionIva(condicionIva);
        factura.setTipoMoneda(tipoMoneda);
        factura.setCliente(cliente);
        factura.setObservaciones(requestDTO.getObservaciones());
        factura.setEstado("EMITIDA");

        factura.setFechaAlta(new Date());
        factura.setFechaModificacion(new Date());
        Usuario usuarioAuditoria = new Usuario();
        usuarioAuditoria.setId(1L);
        factura.setUsuarioCarga(usuarioAuditoria);
        factura.setUsuarioModificacion(usuarioAuditoria);

        List<FacturaVentaDetalle> detalles = new ArrayList<>();
        double importeTotalFactura = 0.0;

        for (FacturaDetalleRequestDTO itemDTO : requestDTO.getDetalles()) {
            ListaPrecioArticulo precioArticulo = listaPrecioArticuloRepository.findById(itemDTO.getArticuloId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Artículo/Precio no encontrado para el ID: " + itemDTO.getArticuloId()));

            FacturaVentaDetalle detalle = new FacturaVentaDetalle();
            detalle.setFactura(factura);
            detalle.setListaPrecioArticulo(precioArticulo);
            detalle.setDescripcion(precioArticulo.getArticulo().getDenominacion());
            detalle.setCantidad(itemDTO.getCantidad());
            detalle.setPrecioUnitario(precioArticulo.getPrecioVenta());
            detalle.setPorcentajeBonificacion(itemDTO.getPorcentajeBonificacion());

            double precioLista = precioArticulo.getPrecioVenta(); // Ej: 900.00 (Ya incluye IVA)

            // El subtotal real del ítem es la cantidad por el precio de lista
            double importeSubtotal = itemDTO.getCantidad() * precioLista;

            // Desglosamos el Neto y el IVA hacia atrás para que la factura cierre perfecta
            double importeNeto = importeSubtotal / 1.21;
            double importeIva = importeSubtotal - importeNeto;

            detalle.setPrecioUnitario(precioLista);
            detalle.setImporteNeto(importeNeto);
            detalle.setImporteIva(importeIva);
            detalle.setImporteSubtotal(importeSubtotal);

            detalles.add(detalle);
            importeTotalFactura += importeSubtotal;
        }

        factura.setDetalles(detalles);
        factura.setImporteTotal(importeTotalFactura);
        factura.setImporteCobrado(0.0);
        factura.setImporteSaldo(importeTotalFactura);

        return facturaRepository.save(factura);
    }

    @Transactional
    public FacturaVenta actualizar(Long id, FacturaRequestDTO requestDTO) {
        FacturaVenta facturaExistente = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura no encontrada con el ID: " + id));

        if ("ANULADA".equals(facturaExistente.getEstado())) {
            throw new IllegalStateException("No se puede modificar una factura ANULADA.");
        }

        if (facturaExistente.getCae() != null && !facturaExistente.getCae().isEmpty()) {
            throw new IllegalStateException("Bloqueo ARCA: No se puede modificar una factura que ya fue informada a AFIP.");
        }

        if (requestDTO.getPuntoVentaId() != null) {
            PuntoVenta puntoVenta = puntoVentaRepository.findById(requestDTO.getPuntoVentaId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Punto de venta no encontrado con ID: " + requestDTO.getPuntoVentaId()));
            facturaExistente.setPuntoVenta(puntoVenta);
        }
        if (requestDTO.getClienteId() != null) {
            Cliente cliente = clienteRepository.findById(requestDTO.getClienteId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con ID: " + requestDTO.getClienteId()));
            facturaExistente.setCliente(cliente);
        }

        facturaExistente.setObservaciones(requestDTO.getObservaciones());
        facturaExistente.setFechaModificacion(new Date());
        Usuario usuarioAuditoria = new Usuario();
        usuarioAuditoria.setId(1L);
        facturaExistente.setUsuarioModificacion(usuarioAuditoria);

        facturaExistente.getDetalles().clear();
        double nuevoImporteTotal = 0;

        for (FacturaDetalleRequestDTO itemDTO : requestDTO.getDetalles()) {
            ListaPrecioArticulo precioArticulo = listaPrecioArticuloRepository.findById(itemDTO.getArticuloId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Artículo/Precio no encontrado para el ID: " + itemDTO.getArticuloId()));

            FacturaVentaDetalle detalle = new FacturaVentaDetalle();
            detalle.setFactura(facturaExistente);
            detalle.setListaPrecioArticulo(precioArticulo);
            detalle.setDescripcion(precioArticulo.getArticulo().getDenominacion());
            detalle.setCantidad(itemDTO.getCantidad());
            detalle.setPrecioUnitario(precioArticulo.getPrecioVenta());
            detalle.setPorcentajeBonificacion(itemDTO.getPorcentajeBonificacion());

            double precioLista = precioArticulo.getPrecioVenta(); // Ej: 900.00 (Ya incluye IVA)

            // El subtotal real del ítem es la cantidad por el precio de lista
            double importeSubtotal = itemDTO.getCantidad() * precioLista;

            // Desglosamos el Neto y el IVA hacia atrás para que la factura cierre perfecta
            double importeNeto = importeSubtotal / 1.21;
            double importeIva = importeSubtotal - importeNeto;

            detalle.setPrecioUnitario(precioLista);
            detalle.setImporteNeto(importeNeto);
            detalle.setImporteIva(importeIva);
            detalle.setImporteSubtotal(importeSubtotal);

            facturaExistente.getDetalles().add(detalle);
            nuevoImporteTotal += importeSubtotal;
        }

        facturaExistente.setImporteTotal(nuevoImporteTotal);
        facturaExistente.setImporteSaldo(nuevoImporteTotal - facturaExistente.getImporteCobrado());

        return facturaRepository.save(facturaExistente);
    }

    @Transactional(readOnly = true)
    public Page<FacturaReporteDTO> buscarFacturasPaginadas(Long numero, Date fechaDesde, Date fechaHasta, String cliente, Boolean informadaArca, Pageable pageable) {
        Page<FacturaVenta> paginaFacturas = facturaRepository.buscarConFiltros(numero, fechaDesde, fechaHasta, cliente, informadaArca, pageable);
        return paginaFacturas.map(this::mapearADto);
    }

    @Transactional(readOnly = true)
    public List<FacturaReporteDTO> buscarFacturasListado(Long numero, Date fechaDesde, Date fechaHasta, String cliente, Boolean informadaArca) {
        return facturaRepository.buscarConFiltros(numero, fechaDesde, fechaHasta, cliente, informadaArca, Pageable.unpaged())
                .getContent().stream().map(this::mapearADto).toList();
    }

    public FacturaReporteDTO mapearADto(FacturaVenta f) {
        FacturaReporteDTO dto = new FacturaReporteDTO();
        dto.setId(f.getId());
        dto.setNumeroFactura(f.getNumero());
        dto.setFechaEmision(f.getFechaEmision());
        dto.setClienteDenominacion(f.getCliente() != null ? f.getCliente().getDenominacion() : "Consumidor Final");
        dto.setCondicionIva(f.getCondicionIva() != null ? f.getCondicionIva().getDenominacion() : "");
        dto.setPuntoVentaDescripcion(f.getPuntoVenta() != null ? f.getPuntoVenta().getDescripcion() : "");
        dto.setImporteTotal(f.getImporteTotal());
        dto.setCantidadItems((long) (f.getDetalles() != null ? f.getDetalles().size() : 0));
        dto.setEstado(f.getEstado());
        dto.setCae(f.getCae());
        return dto;
    }

    @Transactional
    public void eliminar(Long id) {
        FacturaVenta facturaExistente = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura no encontrada con el ID: " + id));

        if (facturaExistente.getCae() == null || facturaExistente.getCae().isEmpty()) {
            facturaRepository.delete(facturaExistente);
        } else {
            facturaExistente.setEstado("ANULADA");
            facturaExistente.setFechaAnulacion(new Date());
            facturaExistente.setFechaModificacion(new Date());
            Usuario usuarioAuditoria = new Usuario();
            usuarioAuditoria.setId(1L);
            facturaExistente.setUsuarioModificacion(usuarioAuditoria);
            facturaRepository.save(facturaExistente);
        }
    }

    @Transactional
    public FacturaVenta informarArca(Long id) {
        FacturaVenta factura = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura no encontrada con el ID: " + id));

        if (factura.getCae() != null && !factura.getCae().isEmpty()) {
            throw new IllegalStateException("La factura ya se encuentra informada a ARCA.");
        }

        try {
            String cuit = "23405971674";
            String keyPath = "C:\\Flor\\Desarrollo de Software\\desarrollo-software-grupo\\Sistema-Facturacion\\Backend-Facturacion\\src\\main\\resources\\privada_test.key";
            String certPath = "C:\\Flor\\Desarrollo de Software\\desarrollo-software-grupo\\Sistema-Facturacion\\Backend-Facturacion\\src\\main\\resources\\certificado_test.crt";
            int puntoDeVenta = 1;

            String[] auth = ar.edu.utn.arca.AfipWsaaClient.obtenerTokenYSign(keyPath, certPath, "wsfe", cuit);
            String token = auth[0];
            String sign = auth[1];

            int ultimoNro = ar.edu.utn.arca.AfipWsfeClient.obtenerUltimoComprobante(token, sign, Long.parseLong(cuit), puntoDeVenta, 11);
            int nuevoNro = ultimoNro + 1;

            ar.gov.afip.wsfe.FECAEResponse response = ar.edu.utn.arca.AfipWsfeClient.solicitarCae(
                    token, sign, Long.parseLong(cuit), puntoDeVenta, nuevoNro, factura.getImporteTotal(), 5);

            String resultado = response.getFeCabResp().getResultado();

            if ("A".equals(resultado)) {
                ar.gov.afip.wsfe.FECAEDetResponse detResp = response.getFeDetResp().getFECAEDetResponse().get(0);
                factura.setCae(detResp.getCAE());

                String vtoStr = detResp.getCAEFchVto();
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyyMMdd");
                factura.setCaeFechaVencimiento(sdf.parse(vtoStr));

                factura.setNumero((long) nuevoNro);
                factura.setResultadoAfip("APROBADO");
            } else {
                String mensajeError = "Rechazado por AFIP.";
                if (response.getFeDetResp() != null && !response.getFeDetResp().getFECAEDetResponse().isEmpty()) {
                    mensajeError = response.getFeDetResp().getFECAEDetResponse().get(0).getObservaciones().getObs().get(0).getMsg();
                } else if (response.getErrors() != null) {
                    mensajeError = response.getErrors().getErr().get(0).getMsg();
                }
                factura.setResultadoAfip("RECHAZADO: " + mensajeError);
                throw new IllegalStateException("AFIP rechazó el comprobante: " + mensajeError);
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error al comunicarse con ARCA: " + e.getMessage());
        }

        return facturaRepository.save(factura);
    }
}