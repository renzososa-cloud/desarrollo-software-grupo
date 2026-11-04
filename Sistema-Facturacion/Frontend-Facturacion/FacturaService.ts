import { FacturaRequestDTO, ArticuloCatalogoDTO } from './models/factura.dto.js';

export interface FiltrosBusqueda {
    numero?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    cliente?: string;
    informadaArca?: string;
}

export class FacturaService {
    private baseUrl: string = 'http://localhost:8080/api/facturas';
    private catalogoUrl: string = 'http://localhost:8080/api/catalogo/articulos';
    private clientesUrl: string = 'http://localhost:8080/api/clientes'; // NUEVO

    async obtenerFacturas(page: number = 0, size: number = 5, filtros: FiltrosBusqueda = {}): Promise<any> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });

            if (filtros.numero) params.append('numero', filtros.numero);
            if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
            if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
            if (filtros.cliente) params.append('cliente', filtros.cliente);
            if (filtros.informadaArca !== undefined && filtros.informadaArca !== '') {
                params.append('informadaArca', filtros.informadaArca);
            }

            const response = await fetch(`${this.baseUrl}?${params.toString()}`);
            if (!response.ok) throw new Error('Error al cargar facturas');
            return await response.json();
        } catch (error) {
            console.error('Error al cargar facturas:', error);
            return { content: [], totalPages: 0 };
        }
    }

    async crearFactura(facturaData: FacturaRequestDTO): Promise<boolean> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(facturaData)
            });
            return response.ok;
        } catch (error) {
            console.error('Error de red:', error);
            return false;
        }
    }

    async eliminarFactura(id: number): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
            return response.ok;
        } catch (error) {
            console.error('Error al eliminar:', error);
            return false;
        }
    }

    async informarArca(id: number): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}/informar-arca`, { method: 'POST' });
            return response.ok;
        } catch (error) {
            console.error('Error al informar a ARCA:', error);
            return false;
        }
    }

    async obtenerCatalogo(): Promise<ArticuloCatalogoDTO[]> {
        try {
            const response = await fetch(this.catalogoUrl);
            if (!response.ok) throw new Error('Error al cargar catálogo');
            return await response.json();
        } catch (error) {
            console.error('Error al cargar catálogo:', error);
            return [];
        }
    }

    // NUEVO MÉTODO
    async obtenerClientes(): Promise<any[]> {
        try {
            const response = await fetch(this.clientesUrl);
            if (!response.ok) throw new Error('Error al cargar clientes');
            return await response.json();
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            return [];
        }
    }
}