import { FacturaRequestDTO, FacturaReporteDTO } from './models/factura.dto.js';

export class FacturaService {
    private baseUrl = 'http://localhost:8080/api/facturas';

    // Ahora soporta paginación
    async obtenerFacturas(page: number = 0, size: number = 5): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}?page=${page}&size=${size}`);
            if (!response.ok) throw new Error('Error al cargar facturas');
            return await response.json(); // Retorna el objeto Page completo
        } catch (error) {
            console.error('Error:', error);
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

    // Nuevo método para informar a AFIP
    async informarArca(id: number): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}/informar-arca`, { method: 'POST' });
            return response.ok;
        } catch (error) {
            console.error('Error al informar a ARCA:', error);
            return false;
        }
    }
}