export interface FacturaReporteDTO {
    numeroFactura: number;
    fechaEmision: string;
    clienteDenominacion: string;
    condicionIva: string;
    puntoVentaDescripcion: string;
    importeTotal: number;
    cantidadItems: number;
}
export interface FacturaDetalleRequestDTO {
    articuloId: number;
    cantidad: number;
    porcentajeBonificacion: number;
}
export interface FacturaRequestDTO {
    fechaEmision?: string;
    puntoVentaId: number;
    clienteId?: number;
    condicionIvaId: number;
    tipoMonedaId: number;
    observaciones?: string;
    detalles: FacturaDetalleRequestDTO[];
}
//# sourceMappingURL=factura.dto.d.ts.map