import type { FacturaReporteDTO, FacturaRequestDTO } from './models/factura.dto';
export interface FacturaFiltrosDTO {
    fechaDesde?: string;
    fechaHasta?: string;
    estado?: string;
    montoMinimo?: number;
}
export declare class FacturaService {
    private baseUrl;
    obtenerFacturas(filtros?: FacturaFiltrosDTO): Promise<FacturaReporteDTO[]>;
    crearFactura(factura: FacturaRequestDTO): Promise<FacturaReporteDTO>;
    actualizarFactura(id: number, facturaUpdate: FacturaRequestDTO): Promise<FacturaReporteDTO>;
    eliminarFactura(id: number): Promise<void>;
}
//# sourceMappingURL=FacturaService.d.ts.map