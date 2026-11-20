export type TabEstadoFactura = 'SIN_EMITIR' | 'EMITIDA' | 'ELIMINADAS';
export type SeccionActiva = TabEstadoFactura | 'CLIENTES' | 'ARTICULOS' | 'MARCAS' | 'RUBROS';

export interface FacturaReporteDTO {
    id: number;
    numeroFactura: number | null;
    fechaEmision: string | null;
    fechaCreacionInterna: string | null;
    clienteDenominacion: string;
    condicionIva: string;
    puntoVentaDescripcion: string;
    listaPrecioDescripcion?: string;
    importeTotal: number;
    cantidadItems: number;
    estado: string;
    cae?: string | null;
    eliminada: boolean;
}

export interface FacturaDetalleRequestDTO {
    listaPrecioArticuloId: number;
    cantidad: number;
    porcentajeBonificacion: number;
}

export interface FacturaRequestDTO {
    puntoVentaId: number;
    clienteId: number | null;
    listaPrecioId: number;
    condicionIvaId: number;
    tipoMonedaId: number;
    observaciones: string;
    detalles: FacturaDetalleRequestDTO[];
}

export interface FacturaDetalleResponseDTO {
    id: number;
    articuloId: number;
    articuloCodigo: string;
    articuloDenominacion: string;
    listaPrecioArticuloId: number;
    listaPrecioId: number;
    listaPrecio: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    porcentajeBonificacion: number;
    importeSubtotal: number;
}

export interface FacturaResponseDTO {
    id: number;
    numero: number | null;
    fechaEmision: string | null;
    fechaCreacionInterna: string | null;
    puntoVentaId: number;
    puntoVentaNumero: number;
    puntoVentaDescripcion: string;
    tipoComprobante: number;
    clienteId: number | null;
    clienteDenominacion: string;
    clienteCuitCuil?: string | null;
    listaPrecioId: number | null;
    listaPrecioCodigo?: string;
    listaPrecio?: string;
    condicionIvaId: number;
    condicionIva: string;
    tipoMonedaId: number;
    tipoMoneda: string;
    usuario: string;
    estado: string;
    importeCobrado: number;
    importeSaldo: number;
    importeTotal: number;
    observaciones?: string | null;
    cae?: string | null;
    caeFechaVencimiento?: string | null;
    resultadoAfip?: string | null;
    motivoRechazo?: string | null;
    detalles: FacturaDetalleResponseDTO[];
}

export interface ArticuloCatalogoDTO {
    id: number; // lista_precio_articulo.id
    articuloId: number;
    articuloCodigo: string;
    articuloNombre: string;
    rubroId?: number;
    rubroNombre?: string;
    marcaId?: number;
    marcaNombre?: string;
    precioVenta: number;
    listaPrecioId: number;
    listaPrecioCodigo: string;
    listaNombre: string;
    activo?: boolean;
}

export interface ListaPrecioDTO {
    id: number;
    codigo: string;
    denominacion: string;
}

export interface ClienteDTO {
    id: number;
    tipoDocumento?: string;
    cuitCuil: string;
    denominacion: string;
    condicionIvaId?: number;
    condicionIva?: string;
    listaPrecioPredeterminadaId?: number;
    listaPrecioNombre?: string;
    telefono?: string;
    celular?: string;
    email?: string;
    calle?: string;
    numero?: string;
    domicilio?: string;
    fechaAlta?: string;
    ultimaCompra?: string | null;
    activo?: boolean;
}

export interface MarcaDTO {
    id: number;
    codigo: string;
    denominacion: string;
    fechaAlta: string;
    activo: boolean;
}

export interface RubroDTO {
    id: number;
    codigo: string;
    denominacion: string;
    fechaAlta: string;
    activo: boolean;
}