package ar.edu.utn.servicio;

import ar.edu.utn.dto.*;
import ar.edu.utn.excepciones.RecursoNoEncontradoException;
import ar.edu.utn.modelo.*;
import ar.edu.utn.repositorio.*;

import org.springframework.core.io.ResourceLoader;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.text.SimpleDateFormat;
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
    private final ListaPrecioRepository listaPrecioRepository;
    private final ListaPrecioArticuloRepository listaPrecioArticuloRepository;
    private final ResourceLoader resourceLoader;

    public FacturaService(FacturaVentaRepository facturaRepository, PuntoVentaRepository puntoVentaRepository,
                          ClienteRepository clienteRepository, CondicionIvaRepository condicionIvaRepository,
                          TipoMonedaRepository tipoMonedaRepository, ListaPrecioRepository listaPrecioRepository,
                          ListaPrecioArticuloRepository listaPrecioArticuloRepository,
                          ResourceLoader resourceLoader) {
        this.facturaRepository = facturaRepository;
        this.puntoVentaRepository = puntoVentaRepository;
        this.clienteRepository = clienteRepository;
        this.condicionIvaRepository = condicionIvaRepository;
        this.tipoMonedaRepository = tipoMonedaRepository;
        this.listaPrecioRepository = listaPrecioRepository;
        this.listaPrecioArticuloRepository = listaPrecioArticuloRepository;
        this.resourceLoader = resourceLoader;
    }

    @Transactional
    public FacturaVenta crear(FacturaRequestDTO requestDTO) {
        if (requestDTO.getDetalles() == null || requestDTO.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("La factura debe contener al menos un ítem.");
        }

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

        ListaPrecio listaPrecio = null;
        if (requestDTO.getListaPrecioId() != null) {
            listaPrecio = listaPrecioRepository.findById(requestDTO.getListaPrecioId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Lista de precios no encontrada con ID: " + requestDTO.getListaPrecioId()));
        }

        FacturaVenta factura = new FacturaVenta();
        // Al guardar sin emitir, numero, fechaEmision y cae quedan en null hasta informar a ARCA
        factura.setNumero(null);
        factura.setFechaEmision(null);
        factura.setTipoComprobante(11);
        factura.setPuntoVenta(puntoVenta);
        factura.setCondicionIva(condicionIva);
        factura.setTipoMoneda(tipoMoneda);
        factura.setCliente(cliente);
        factura.setListaPrecio(listaPrecio);
        factura.setObservaciones(requestDTO.getObservaciones());
        factura.setEstado("SIN_EMITIR");

        factura.setFechaAlta(new Date());
        factura.setFechaModificacion(new Date());
        Usuario usuarioAuditoria = new Usuario();
        usuarioAuditoria.setId(1L);
        factura.setUsuarioCarga(usuarioAuditoria);
        factura.setUsuarioModificacion(usuarioAuditoria);

        List<FacturaVentaDetalle> detalles = new ArrayList<>();
        double importeTotalFactura = 0.0;

        for (FacturaDetalleRequestDTO itemDTO : requestDTO.getDetalles()) {
            FacturaVentaDetalle detalle = crearDetalleDesdeDTO(factura, itemDTO);
            if (factura.getListaPrecio() == null && detalle.getListaPrecioArticulo() != null) {
                factura.setListaPrecio(detalle.getListaPrecioArticulo().getListaPrecio());
            }
            detalles.add(detalle);
            importeTotalFactura += detalle.getImporteSubtotal();
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

        if (facturaExistente.getFechaBaja() != null || "ANULADA".equals(facturaExistente.getEstado())) {
            throw new IllegalStateException("No se puede modificar una factura eliminada o anulada.");
        }

        if (facturaExistente.getCae() != null && !facturaExistente.getCae().isEmpty() || "EMITIDA".equals(facturaExistente.getEstado())) {
            throw new IllegalStateException("Bloqueo ARCA: No se puede modificar una factura que ya fue emitida e informada a AFIP.");
        }

        if (requestDTO.getDetalles() == null || requestDTO.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("La factura debe contener al menos un ítem.");
        }

        if (requestDTO.getPuntoVentaId() != null) {
            PuntoVenta puntoVenta = puntoVentaRepository.findById(requestDTO.getPuntoVentaId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Punto de venta no encontrado con ID: " + requestDTO.getPuntoVentaId()));
            facturaExistente.setPuntoVenta(puntoVenta);
        }

        // Si clienteId es null, vuelve a Consumidor Final
        if (requestDTO.getClienteId() != null) {
            Cliente cliente = clienteRepository.findById(requestDTO.getClienteId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con ID: " + requestDTO.getClienteId()));
            facturaExistente.setCliente(cliente);
        } else {
            facturaExistente.setCliente(null);
        }

        if (requestDTO.getListaPrecioId() != null) {
            ListaPrecio listaPrecio = listaPrecioRepository.findById(requestDTO.getListaPrecioId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Lista de precios no encontrada con ID: " + requestDTO.getListaPrecioId()));
            facturaExistente.setListaPrecio(listaPrecio);
        }

        if (requestDTO.getCondicionIvaId() != null) {
            CondicionIva condicionIva = condicionIvaRepository.findById(requestDTO.getCondicionIvaId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Condición de IVA no encontrada con ID: " + requestDTO.getCondicionIvaId()));
            facturaExistente.setCondicionIva(condicionIva);
        }

        if (requestDTO.getTipoMonedaId() != null) {
            TipoMoneda tipoMoneda = tipoMonedaRepository.findById(requestDTO.getTipoMonedaId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Tipo de moneda no encontrado con ID: " + requestDTO.getTipoMonedaId()));
            facturaExistente.setTipoMoneda(tipoMoneda);
        }

        facturaExistente.setObservaciones(requestDTO.getObservaciones());
        facturaExistente.setFechaModificacion(new Date());
        Usuario usuarioAuditoria = new Usuario();
        usuarioAuditoria.setId(1L);
        facturaExistente.setUsuarioModificacion(usuarioAuditoria);

        facturaExistente.getDetalles().clear();
        double nuevoImporteTotal = 0.0;

        for (FacturaDetalleRequestDTO itemDTO : requestDTO.getDetalles()) {
            FacturaVentaDetalle detalle = crearDetalleDesdeDTO(facturaExistente, itemDTO);
            facturaExistente.getDetalles().add(detalle);
            nuevoImporteTotal += detalle.getImporteSubtotal();
        }

        facturaExistente.setImporteTotal(nuevoImporteTotal);
        facturaExistente.setImporteSaldo(nuevoImporteTotal - facturaExistente.getImporteCobrado());

        return facturaRepository.save(facturaExistente);
    }

    private FacturaVentaDetalle crearDetalleDesdeDTO(FacturaVenta factura, FacturaDetalleRequestDTO itemDTO) {
        if (itemDTO.getListaPrecioArticuloId() == null) {
            throw new IllegalArgumentException("Cada ítem debe especificar un listaPrecioArticuloId.");
        }
        if (itemDTO.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad de cada ítem debe ser mayor a cero.");
        }
        if (itemDTO.getPorcentajeBonificacion() < 0 || itemDTO.getPorcentajeBonificacion() > 100) {
            throw new IllegalArgumentException("El porcentaje de bonificación debe estar entre 0 y 100.");
        }

        ListaPrecioArticulo precioArticulo = listaPrecioArticuloRepository.findById(itemDTO.getListaPrecioArticuloId())
                .orElseThrow(() -> new RecursoNoEncontradoException("ListaPrecioArticulo no encontrado para el ID: " + itemDTO.getListaPrecioArticuloId()));

        double precioLista = precioArticulo.getPrecioVenta();
        double bruto = itemDTO.getCantidad() * precioLista;
        double descuento = bruto * (itemDTO.getPorcentajeBonificacion() / 100.0);
        double importeSubtotal = Math.round((bruto - descuento) * 100.0) / 100.0;

        double importeNeto = Math.round((importeSubtotal / 1.21) * 100.0) / 100.0;
        double importeIva = Math.round((importeSubtotal - importeNeto) * 100.0) / 100.0;

        FacturaVentaDetalle detalle = new FacturaVentaDetalle();
        detalle.setFactura(factura);
        detalle.setListaPrecioArticulo(precioArticulo);
        detalle.setDescripcion(precioArticulo.getArticulo().getDenominacion());
        detalle.setCantidad(itemDTO.getCantidad());
        detalle.setPrecioUnitario(precioLista);
        detalle.setPorcentajeBonificacion(itemDTO.getPorcentajeBonificacion());
        detalle.setImporteNeto(importeNeto);
        detalle.setImporteIva(importeIva);
        detalle.setImporteSubtotal(importeSubtotal);

        return detalle;
    }

    @Transactional(readOnly = true)
    public FacturaResponseDTO obtenerPorId(Long id) {
        FacturaVenta f = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura no encontrada con el ID: " + id));
        return mapearAResponseDto(f);
    }

    @Transactional(readOnly = true)
    public Page<FacturaReporteDTO> buscarFacturasPaginadas(String tab, Long numero, Date fechaDesde, Date fechaHasta, String cliente, Double montoMinimo, Pageable pageable) {
        Page<FacturaVenta> paginaFacturas = facturaRepository.buscarConFiltros(tab, numero, fechaDesde, fechaHasta, cliente, montoMinimo, pageable);
        return paginaFacturas.map(this::mapearADto);
    }

    @Transactional(readOnly = true)
    public List<FacturaReporteDTO> buscarFacturasListado(String tab, Long numero, Date fechaDesde, Date fechaHasta, String cliente, Double montoMinimo) {
        return facturaRepository.buscarConFiltros(tab, numero, fechaDesde, fechaHasta, cliente, montoMinimo, Pageable.unpaged())
                .getContent().stream().map(this::mapearADto).toList();
    }

    public FacturaReporteDTO mapearADto(FacturaVenta f) {
        FacturaReporteDTO dto = new FacturaReporteDTO();
        dto.setId(f.getId());
        dto.setNumeroFactura(f.getNumero());
        dto.setFechaEmision(f.getFechaEmision());
        dto.setFechaCreacionInterna(f.getFechaAlta());
        dto.setClienteDenominacion(f.getCliente() != null ? f.getCliente().getDenominacion() : "Consumidor Final");
        dto.setCondicionIva(f.getCondicionIva() != null ? f.getCondicionIva().getDenominacion() : "");
        dto.setPuntoVentaDescripcion(f.getPuntoVenta() != null ? f.getPuntoVenta().getDescripcion() : "");
        dto.setListaPrecioDescripcion(f.getListaPrecio() != null ? f.getListaPrecio().getDenominacion() : "");
        dto.setImporteTotal(f.getImporteTotal());
        dto.setCantidadItems((long) (f.getDetalles() != null ? f.getDetalles().size() : 0));
        boolean tieneCae = f.getCae() != null && !f.getCae().trim().isEmpty();
        String estadoEfectivo = "ANULADA".equals(f.getEstado())
                ? "ANULADA"
                : (tieneCae ? "EMITIDA" : "SIN_EMITIR");
        dto.setEstado(estadoEfectivo);
        dto.setCae(f.getCae());
        dto.setEliminada(f.getFechaBaja() != null);
        return dto;
    }

    public FacturaResponseDTO mapearAResponseDto(FacturaVenta f) {
        FacturaResponseDTO dto = new FacturaResponseDTO();
        dto.setId(f.getId());
        dto.setNumero(f.getNumero());
        dto.setFechaEmision(f.getFechaEmision());
        dto.setFechaCreacionInterna(f.getFechaAlta());
        dto.setTipoComprobante(f.getTipoComprobante());

        if (f.getPuntoVenta() != null) {
            dto.setPuntoVentaId(f.getPuntoVenta().getId());
            dto.setPuntoVentaNumero(f.getPuntoVenta().getNumero());
            dto.setPuntoVentaDescripcion(f.getPuntoVenta().getDescripcion());
        }

        if (f.getCliente() != null) {
            dto.setClienteId(f.getCliente().getId());
            dto.setClienteDenominacion(f.getCliente().getDenominacion());
            dto.setClienteCuitCuil(f.getCliente().getCuitCuil());
        } else {
            dto.setClienteDenominacion("Consumidor Final");
        }

        if (f.getListaPrecio() != null) {
            dto.setListaPrecioId(f.getListaPrecio().getId());
            dto.setListaPrecioCodigo(f.getListaPrecio().getCodigo());
            dto.setListaPrecio(f.getListaPrecio().getDenominacion());
        }

        if (f.getCondicionIva() != null) {
            dto.setCondicionIvaId(f.getCondicionIva().getId());
            dto.setCondicionIva(f.getCondicionIva().getDenominacion());
        }

        if (f.getTipoMoneda() != null) {
            dto.setTipoMonedaId(f.getTipoMoneda().getId());
            dto.setTipoMoneda(f.getTipoMoneda().getDenominacion());
        }

        dto.setUsuario(f.getUsuarioCarga() != null ? f.getUsuarioCarga().getUsuario() : "admin");
        boolean tieneCae = f.getCae() != null && !f.getCae().trim().isEmpty();
        String estadoEfectivo = "ANULADA".equals(f.getEstado())
                ? "ANULADA"
                : (tieneCae ? "EMITIDA" : "SIN_EMITIR");
        dto.setEstado(estadoEfectivo);
        dto.setImporteCobrado(f.getImporteCobrado());
        dto.setImporteSaldo(f.getImporteSaldo());
        dto.setImporteTotal(f.getImporteTotal());
        dto.setObservaciones(f.getObservaciones());
        dto.setCae(f.getCae());
        dto.setCaeFechaVencimiento(f.getCaeFechaVencimiento());
        dto.setResultadoAfip(f.getResultadoAfip());
        dto.setMotivoRechazo(f.getMotivoRechazo());

        List<FacturaDetalleResponseDTO> detallesDto = new ArrayList<>();
        if (f.getDetalles() != null) {
            for (FacturaVentaDetalle d : f.getDetalles()) {
                FacturaDetalleResponseDTO dDto = new FacturaDetalleResponseDTO();
                dDto.setId(d.getId());
                if (d.getListaPrecioArticulo() != null) {
                    dDto.setListaPrecioArticuloId(d.getListaPrecioArticulo().getId());
                    if (d.getListaPrecioArticulo().getListaPrecio() != null) {
                        dDto.setListaPrecioId(d.getListaPrecioArticulo().getListaPrecio().getId());
                        dDto.setListaPrecio(d.getListaPrecioArticulo().getListaPrecio().getDenominacion());
                    }
                    if (d.getListaPrecioArticulo().getArticulo() != null) {
                        dDto.setArticuloId(d.getListaPrecioArticulo().getArticulo().getId());
                        dDto.setArticuloCodigo(d.getListaPrecioArticulo().getArticulo().getCodigo());
                        dDto.setArticuloDenominacion(d.getListaPrecioArticulo().getArticulo().getDenominacion());
                    }
                }
                dDto.setDescripcion(d.getDescripcion());
                dDto.setCantidad(d.getCantidad());
                dDto.setPrecioUnitario(d.getPrecioUnitario());
                dDto.setPorcentajeBonificacion(d.getPorcentajeBonificacion());
                dDto.setImporteSubtotal(d.getImporteSubtotal());
                detallesDto.add(dDto);
            }
        }
        dto.setDetalles(detallesDto);
        return dto;
    }

    @Transactional
    public void eliminar(Long id) {
        FacturaVenta facturaExistente = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura no encontrada con el ID: " + id));

        Usuario usuarioAuditoria = new Usuario();
        usuarioAuditoria.setId(1L);

        if (facturaExistente.getCae() == null || facturaExistente.getCae().isEmpty()) {
            // Baja lógica para facturas SIN_EMITIR -> pasan a la pestaña "Eliminadas"
            facturaExistente.setFechaBaja(new Date());
            facturaExistente.setUsuarioBaja(usuarioAuditoria);
            facturaExistente.setFechaModificacion(new Date());
            facturaExistente.setUsuarioModificacion(usuarioAuditoria);
            facturaRepository.save(facturaExistente);
        } else {
            facturaExistente.setEstado("ANULADA");
            facturaExistente.setFechaAnulacion(new Date());
            facturaExistente.setFechaModificacion(new Date());
            facturaExistente.setUsuarioModificacion(usuarioAuditoria);
            facturaRepository.save(facturaExistente);
        }
    }

    @Transactional
    public void restaurar(Long id) {
        FacturaVenta facturaExistente = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura no encontrada con el ID: " + id));

        if (facturaExistente.getCae() != null && !facturaExistente.getCae().isEmpty()) {
            throw new IllegalStateException("No se puede restaurar una factura que ya fue emitida.");
        }

        Usuario usuarioAuditoria = new Usuario();
        usuarioAuditoria.setId(1L);

        facturaExistente.setFechaBaja(null);
        facturaExistente.setUsuarioBaja(null);
        facturaExistente.setEstado("SIN_EMITIR");
        facturaExistente.setFechaModificacion(new Date());
        facturaExistente.setUsuarioModificacion(usuarioAuditoria);
        facturaRepository.save(facturaExistente);
    }

    @Transactional
    public void eliminarDefinitivo(Long id) {
        FacturaVenta facturaExistente = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura no encontrada con el ID: " + id));

        if ((facturaExistente.getCae() != null && !facturaExistente.getCae().isEmpty())
                || "EMITIDA".equals(facturaExistente.getEstado())) {
            throw new IllegalStateException("Bloqueo ARCA: No se puede eliminar definitivamente una factura emitida.");
        }

        facturaRepository.delete(facturaExistente);
    }

    @Transactional
    public FacturaVenta informarArca(Long id) {
        FacturaVenta factura = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura no encontrada con el ID: " + id));

        if (factura.getFechaBaja() != null) {
            throw new IllegalStateException("No se puede emitir una factura eliminada.");
        }

        if (factura.getCae() != null && !factura.getCae().isEmpty()) {
            throw new IllegalStateException("La factura ya se encuentra informada a ARCA.");
        }

        try (InputStream keyStream = resourceLoader.getResource("classpath:privada_test.key").getInputStream();
             InputStream certStream = resourceLoader.getResource("classpath:certificado_test.crt").getInputStream()) {

            File tempKeyFile = File.createTempFile("privada", ".key");
            tempKeyFile.deleteOnExit();
            Files.copy(keyStream, tempKeyFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

            File tempCertFile = File.createTempFile("certificado", ".crt");
            tempCertFile.deleteOnExit();
            Files.copy(certStream, tempCertFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

            String keyPath = tempKeyFile.getAbsolutePath();
            String certPath = tempCertFile.getAbsolutePath();

            String cuit = "23405971674";
            int puntoDeVenta = factura.getPuntoVenta() != null ? factura.getPuntoVenta().getNumero() : 1;

            String[] auth = ar.edu.utn.arca.AfipWsaaClient.obtenerTokenYSign(keyPath, certPath, "wsfe", cuit);
            String token = auth[0];
            String sign = auth[1];

            int ultimoNro = ar.edu.utn.arca.AfipWsfeClient.obtenerUltimoComprobante(token, sign, Long.parseLong(cuit), puntoDeVenta, 11);
            int nuevoNro = ultimoNro + 1;

            ar.gov.afip.wsfe.FECAEResponse response = ar.edu.utn.arca.AfipWsfeClient.solicitarCae(
                    token, sign, Long.parseLong(cuit), puntoDeVenta, nuevoNro, factura.getImporteTotal(), 5);

            String resultado = response.getFeCabResp().getResultado();

            if ("A".equals(resultado)) {
                ar.gov.afip.wsfe.FECAEDetResponse detResp = response.getFeDetResp().getFECAEDetResponse().getFirst();
                factura.setCae(detResp.getCAE());

                String vtoStr = detResp.getCAEFchVto();
                SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
                factura.setCaeFechaVencimiento(sdf.parse(vtoStr));

                factura.setNumero((long) nuevoNro);
                factura.setFechaEmision(new Date());
                factura.setEstado("EMITIDA");
                factura.setResultadoAfip("A");
                factura.setFechaModificacion(new Date());
            } else {
                String mensajeError = "Rechazado por AFIP.";
                if (response.getFeDetResp() != null && !response.getFeDetResp().getFECAEDetResponse().isEmpty()) {
                    mensajeError = response.getFeDetResp().getFECAEDetResponse().getFirst().getObservaciones().getObs().getFirst().getMsg();
                } else if (response.getErrors() != null) {
                    mensajeError = response.getErrors().getErr().getFirst().getMsg();
                }
                factura.setResultadoAfip("RECHAZADO: " + mensajeError);
                factura.setMotivoRechazo(mensajeError);
                throw new IllegalStateException("AFIP rechazó el comprobante: " + mensajeError);
            }

        } catch (Exception e) {
            throw new RuntimeException("Error al comunicarse con ARCA: " + e.getMessage());
        }

        return facturaRepository.save(factura);
    }
}