import {
    FacturaRequestDTO,
    FacturaResponseDTO,
    ArticuloCatalogoDTO,
    ListaPrecioDTO,
    ClienteDTO,
    MarcaDTO,
    RubroDTO,
    TabEstadoFactura
} from './models/factura.dto.js';

export interface FiltrosBusqueda {
    numero?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    cliente?: string;
    montoMinimo?: string;
}

export interface NuevoArticuloPayload {
    denominacion: string;
    rubroId: number;
    rubroNombre: string;
    marcaId: number;
    marcaNombre: string;
    precioMinorista?: number | null;
    precioMayorista?: number | null;
}

export class FacturaService {
    private baseUrl: string = 'http://localhost:8080/api/facturas';
    private catalogoUrl: string = 'http://localhost:8080/api/catalogo/articulos';
    private articulosGestionUrl: string = 'http://localhost:8080/api/articulos-gestion';
    private clientesUrl: string = 'http://localhost:8080/api/clientes';
    private marcasUrl: string = 'http://localhost:8080/api/marcas';
    private rubrosUrl: string = 'http://localhost:8080/api/rubros';

    // =========================================================
    // FACTURACIÓN
    // =========================================================
    async obtenerFacturas(
        tab: TabEstadoFactura = 'SIN_EMITIR',
        page: number = 0,
        size: number = 10,
        filtros: FiltrosBusqueda = {}
    ): Promise<any> {
        try {
            const params = new URLSearchParams({
                tab,
                page: page.toString(),
                size: size.toString()
            });

            if (filtros.numero) params.append('numero', filtros.numero);
            if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
            if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
            if (filtros.cliente) params.append('cliente', filtros.cliente);
            if (filtros.montoMinimo) params.append('montoMinimo', filtros.montoMinimo);

            const response = await fetch(`${this.baseUrl}?${params.toString()}`);
            if (!response.ok) throw new Error('Error al cargar facturas');
            return await response.json();
        } catch (error) {
            console.error('Error al cargar facturas:', error);
            return { content: [], totalPages: 0, totalElements: 0, number: 0, size };
        }
    }

    async obtenerFacturaPorId(id: number): Promise<FacturaResponseDTO | null> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`);
            if (!response.ok) throw new Error('No se pudo obtener el detalle de la factura');
            return await response.json();
        } catch (error) {
            console.error('Error al obtener factura:', error);
            return null;
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
            console.error('Error de red al crear factura:', error);
            return false;
        }
    }

    async actualizarFactura(id: number, facturaData: FacturaRequestDTO): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(facturaData)
            });
            return response.ok;
        } catch (error) {
            console.error('Error al actualizar factura:', error);
            return false;
        }
    }

    async eliminarFactura(id: number): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
            return response.ok;
        } catch (error) {
            console.error('Error al eliminar factura:', error);
            return false;
        }
    }

    async restaurarFactura(id: number): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}/restaurar`, { method: 'PATCH' });
            return response.ok;
        } catch (error) {
            console.error('Error al restaurar borrador:', error);
            return false;
        }
    }

    async eliminarFacturaDefinitiva(id: number): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}/definitivo`, { method: 'DELETE' });
            return response.ok;
        } catch (error) {
            console.error('Error al eliminar definitivamente:', error);
            return false;
        }
    }

    async informarArca(id: number): Promise<{ ok: boolean; mensaje?: string; data?: FacturaResponseDTO }> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}/informar-arca`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json().catch(() => undefined);
                return { ok: true, data };
            }
            const errorTxt = await response.text();
            return { ok: false, mensaje: errorTxt || 'Error al informar el comprobante a ARCA.' };
        } catch (error) {
            console.error('Error al informar a ARCA:', error);
            return { ok: false, mensaje: 'No se pudo establecer conexión con el servidor.' };
        }
    }

    async obtenerListasPrecios(): Promise<ListaPrecioDTO[]> {
        try {
            const response = await fetch(`${this.baseUrl}/listas-precios`);
            if (!response.ok) throw new Error('Error al cargar listas de precios');
            return await response.json();
        } catch (error) {
            console.error('Error al cargar listas de precios:', error);
            return [];
        }
    }

    construirUrlExportacion(tipo: 'pdf' | 'excel', tab: TabEstadoFactura, filtros: FiltrosBusqueda): string {
        const params = new URLSearchParams({ tab });
        if (filtros.numero) params.append('numero', filtros.numero);
        if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
        if (filtros.cliente) params.append('cliente', filtros.cliente);
        if (filtros.montoMinimo) params.append('montoMinimo', filtros.montoMinimo);
        return `${this.baseUrl}/exportar/${tipo}?${params.toString()}`;
    }

    // =========================================================
    // OPERACIÓN: CLIENTES (PERSISTENCIA EN MYSQL)
    // =========================================================
    async obtenerClientes(): Promise<ClienteDTO[]> {
        try {
            const response = await fetch(this.clientesUrl);
            if (!response.ok) throw new Error('Error al obtener clientes');
            const lista = await response.json();
            return lista.map((c: any) => ({
                ...c,
                activo: c.activo !== undefined ? c.activo : c.fechaBaja == null
            }));
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            return [];
        }
    }

    async guardarCliente(cliente: Partial<ClienteDTO>, id?: number): Promise<ClienteDTO> {
        const url = id ? `${this.clientesUrl}/${id}` : this.clientesUrl;
        const method = id ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cliente)
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Error al guardar cliente');
        }
        return await response.json();
    }

    async cambiarEstadoCliente(cliente: ClienteDTO, activo: boolean): Promise<boolean> {
        const url = activo
            ? `${this.clientesUrl}/${cliente.id}/restaurar`
            : `${this.clientesUrl}/${cliente.id}`;
        const response = await fetch(url, { method: activo ? 'PATCH' : 'DELETE' });
        return response.ok;
    }

    // =========================================================
    // OPERACIÓN: ARTÍCULOS Y CATÁLOGO (PERSISTENCIA EN MYSQL)
    // =========================================================
    async obtenerCatalogo(): Promise<ArticuloCatalogoDTO[]> {
        try {
            const response = await fetch(this.articulosGestionUrl);
            if (response.ok) {
                const rows = await response.json();
                return rows.map((r: any) => ({
                    id: r.listaPrecioArticuloId,
                    articuloId: r.articuloId,
                    articuloCodigo: r.codigo,
                    articuloNombre: r.denominacion,
                    rubroId: r.rubroId,
                    rubroNombre: r.rubroNombre,
                    marcaId: r.marcaId,
                    marcaNombre: r.marcaNombre,
                    precioVenta: r.precioVenta,
                    listaPrecioId: r.listaPrecioId,
                    listaPrecioCodigo: r.listaPrecioCodigo,
                    listaNombre: r.listaNombre,
                    activo: r.fechaBaja == null
                }));
            }
        } catch (error) {
            console.warn('Intentando endpoint alternativo de catálogo:', error);
        }

        try {
            const fallback = await fetch(this.catalogoUrl);
            if (fallback.ok) return await fallback.json();
        } catch (error) {
            console.error('Error al cargar catálogo:', error);
        }
        return [];
    }

    async crearArticulo(payload: NuevoArticuloPayload): Promise<boolean> {
        const precios: { listaPrecioId: number; precioVenta: number }[] = [];
        if (payload.precioMinorista != null && payload.precioMinorista > 0) {
            precios.push({ listaPrecioId: 1, precioVenta: payload.precioMinorista });
        }
        if (payload.precioMayorista != null && payload.precioMayorista > 0) {
            precios.push({ listaPrecioId: 2, precioVenta: payload.precioMayorista });
        }

        const response = await fetch(this.articulosGestionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                denominacion: payload.denominacion,
                rubroId: payload.rubroId,
                marcaId: payload.marcaId,
                precios
            })
        });
        return response.ok;
    }

    async cambiarEstadoArticulo(item: ArticuloCatalogoDTO, activo: boolean): Promise<boolean> {
        const url = activo
            ? `${this.articulosGestionUrl}/${item.articuloId}/restaurar`
            : `${this.articulosGestionUrl}/${item.articuloId}`;
        const response = await fetch(url, { method: activo ? 'PATCH' : 'DELETE' });
        return response.ok;
    }

    // =========================================================
    // OPERACIÓN: MARCAS Y RUBROS (PERSISTENCIA EN MYSQL)
    // =========================================================
    async obtenerMarcas(): Promise<MarcaDTO[]> {
        try {
            const response = await fetch(this.marcasUrl);
            if (!response.ok) throw new Error('Error al cargar marcas');
            return await response.json();
        } catch (error) {
            console.error('Error al cargar marcas:', error);
            return [];
        }
    }

    async guardarMarca(denominacion: string, id?: number): Promise<MarcaDTO> {
        const url = id ? `${this.marcasUrl}/${id}` : this.marcasUrl;
        const response = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ denominacion })
        });
        return await response.json();
    }

    async cambiarEstadoMarca(id: number, activo: boolean): Promise<boolean> {
        const url = activo ? `${this.marcasUrl}/${id}/restaurar` : `${this.marcasUrl}/${id}`;
        const response = await fetch(url, { method: activo ? 'PATCH' : 'DELETE' });
        return response.ok;
    }

    async obtenerRubros(): Promise<RubroDTO[]> {
        try {
            const response = await fetch(this.rubrosUrl);
            if (!response.ok) throw new Error('Error al cargar rubros');
            return await response.json();
        } catch (error) {
            console.error('Error al cargar rubros:', error);
            return [];
        }
    }

    async guardarRubro(denominacion: string, id?: number): Promise<RubroDTO> {
        const url = id ? `${this.rubrosUrl}/${id}` : this.rubrosUrl;
        const response = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ denominacion })
        });
        return await response.json();
    }

    async cambiarEstadoRubro(id: number, activo: boolean): Promise<boolean> {
        const url = activo ? `${this.rubrosUrl}/${id}/restaurar` : `${this.rubrosUrl}/${id}`;
        const response = await fetch(url, { method: activo ? 'PATCH' : 'DELETE' });
        return response.ok;
    }
}