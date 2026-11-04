export interface FacturaReporteDTO {
    id: number;
    numeroFactura: number;
    fechaEmision: Date | string;
    clienteDenominacion: string;
    condicionIva: string;
    puntoVentaDescripcion: string;
    importeTotal: number;
    cantidadItems: number;
    estado: string;
    cae?: string;
}

export interface FacturaDetalleRequestDTO {
    articuloId: number;
    cantidad: number;
    porcentajeBonificacion: number;
}

export interface FacturaRequestDTO {
    fechaEmision: Date | string;
    puntoVentaId: number;
    clienteId: number | null;
    condicionIvaId: number;
    tipoMonedaId: number;
    observaciones: string;
    detalles: FacturaDetalleRequestDTO[];
}