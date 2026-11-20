var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class FacturaService {
    constructor() {
        this.baseUrl = 'http://localhost:8080/api/facturas';
        this.catalogoUrl = 'http://localhost:8080/api/catalogo/articulos';
        this.articulosGestionUrl = 'http://localhost:8080/api/articulos-gestion';
        this.clientesUrl = 'http://localhost:8080/api/clientes';
        this.marcasUrl = 'http://localhost:8080/api/marcas';
        this.rubrosUrl = 'http://localhost:8080/api/rubros';
    }
    // =========================================================
    // FACTURACIÓN
    // =========================================================
    obtenerFacturas() {
        return __awaiter(this, arguments, void 0, function* (tab = 'SIN_EMITIR', page = 0, size = 10, filtros = {}) {
            try {
                const params = new URLSearchParams({
                    tab,
                    page: page.toString(),
                    size: size.toString()
                });
                if (filtros.numero)
                    params.append('numero', filtros.numero);
                if (filtros.fechaDesde)
                    params.append('fechaDesde', filtros.fechaDesde);
                if (filtros.fechaHasta)
                    params.append('fechaHasta', filtros.fechaHasta);
                if (filtros.cliente)
                    params.append('cliente', filtros.cliente);
                if (filtros.montoMinimo)
                    params.append('montoMinimo', filtros.montoMinimo);
                const response = yield fetch(`${this.baseUrl}?${params.toString()}`);
                if (!response.ok)
                    throw new Error('Error al cargar facturas');
                return yield response.json();
            }
            catch (error) {
                console.error('Error al cargar facturas:', error);
                return { content: [], totalPages: 0, totalElements: 0, number: 0, size };
            }
        });
    }
    obtenerFacturaPorId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/${id}`);
                if (!response.ok)
                    throw new Error('No se pudo obtener el detalle de la factura');
                return yield response.json();
            }
            catch (error) {
                console.error('Error al obtener factura:', error);
                return null;
            }
        });
    }
    crearFactura(facturaData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(this.baseUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(facturaData)
                });
                return response.ok;
            }
            catch (error) {
                console.error('Error de red al crear factura:', error);
                return false;
            }
        });
    }
    actualizarFactura(id, facturaData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(facturaData)
                });
                return response.ok;
            }
            catch (error) {
                console.error('Error al actualizar factura:', error);
                return false;
            }
        });
    }
    eliminarFactura(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
                return response.ok;
            }
            catch (error) {
                console.error('Error al eliminar factura:', error);
                return false;
            }
        });
    }
    restaurarFactura(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/${id}/restaurar`, { method: 'PATCH' });
                return response.ok;
            }
            catch (error) {
                console.error('Error al restaurar borrador:', error);
                return false;
            }
        });
    }
    eliminarFacturaDefinitiva(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/${id}/definitivo`, { method: 'DELETE' });
                return response.ok;
            }
            catch (error) {
                console.error('Error al eliminar definitivamente:', error);
                return false;
            }
        });
    }
    informarArca(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/${id}/informar-arca`, { method: 'POST' });
                if (response.ok) {
                    const data = yield response.json().catch(() => undefined);
                    return { ok: true, data };
                }
                const errorTxt = yield response.text();
                return { ok: false, mensaje: errorTxt || 'Error al informar el comprobante a ARCA.' };
            }
            catch (error) {
                console.error('Error al informar a ARCA:', error);
                return { ok: false, mensaje: 'No se pudo establecer conexión con el servidor.' };
            }
        });
    }
    obtenerListasPrecios() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/listas-precios`);
                if (!response.ok)
                    throw new Error('Error al cargar listas de precios');
                return yield response.json();
            }
            catch (error) {
                console.error('Error al cargar listas de precios:', error);
                return [];
            }
        });
    }
    construirUrlExportacion(tipo, tab, filtros) {
        const params = new URLSearchParams({ tab });
        if (filtros.numero)
            params.append('numero', filtros.numero);
        if (filtros.fechaDesde)
            params.append('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta)
            params.append('fechaHasta', filtros.fechaHasta);
        if (filtros.cliente)
            params.append('cliente', filtros.cliente);
        if (filtros.montoMinimo)
            params.append('montoMinimo', filtros.montoMinimo);
        return `${this.baseUrl}/exportar/${tipo}?${params.toString()}`;
    }
    // =========================================================
    // OPERACIÓN: CLIENTES (PERSISTENCIA EN MYSQL)
    // =========================================================
    obtenerClientes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(this.clientesUrl);
                if (!response.ok)
                    throw new Error('Error al obtener clientes');
                const lista = yield response.json();
                return lista.map((c) => (Object.assign(Object.assign({}, c), { activo: c.activo !== undefined ? c.activo : c.fechaBaja == null })));
            }
            catch (error) {
                console.error('Error al cargar clientes:', error);
                return [];
            }
        });
    }
    guardarCliente(cliente, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = id ? `${this.clientesUrl}/${id}` : this.clientesUrl;
            const method = id ? 'PUT' : 'POST';
            const response = yield fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente)
            });
            if (!response.ok) {
                const err = yield response.text();
                throw new Error(err || 'Error al guardar cliente');
            }
            return yield response.json();
        });
    }
    cambiarEstadoCliente(cliente, activo) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = activo
                ? `${this.clientesUrl}/${cliente.id}/restaurar`
                : `${this.clientesUrl}/${cliente.id}`;
            const response = yield fetch(url, { method: activo ? 'PATCH' : 'DELETE' });
            return response.ok;
        });
    }
    // =========================================================
    // OPERACIÓN: ARTÍCULOS Y CATÁLOGO (PERSISTENCIA EN MYSQL)
    // =========================================================
    obtenerCatalogo() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(this.articulosGestionUrl);
                if (response.ok) {
                    const rows = yield response.json();
                    return rows.map((r) => ({
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
            }
            catch (error) {
                console.warn('Intentando endpoint alternativo de catálogo:', error);
            }
            try {
                const fallback = yield fetch(this.catalogoUrl);
                if (fallback.ok)
                    return yield fallback.json();
            }
            catch (error) {
                console.error('Error al cargar catálogo:', error);
            }
            return [];
        });
    }
    crearArticulo(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const precios = [];
            if (payload.precioMinorista != null && payload.precioMinorista > 0) {
                precios.push({ listaPrecioId: 1, precioVenta: payload.precioMinorista });
            }
            if (payload.precioMayorista != null && payload.precioMayorista > 0) {
                precios.push({ listaPrecioId: 2, precioVenta: payload.precioMayorista });
            }
            const response = yield fetch(this.articulosGestionUrl, {
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
        });
    }
    cambiarEstadoArticulo(item, activo) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = activo
                ? `${this.articulosGestionUrl}/${item.articuloId}/restaurar`
                : `${this.articulosGestionUrl}/${item.articuloId}`;
            const response = yield fetch(url, { method: activo ? 'PATCH' : 'DELETE' });
            return response.ok;
        });
    }
    // =========================================================
    // OPERACIÓN: MARCAS Y RUBROS (PERSISTENCIA EN MYSQL)
    // =========================================================
    obtenerMarcas() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(this.marcasUrl);
                if (!response.ok)
                    throw new Error('Error al cargar marcas');
                return yield response.json();
            }
            catch (error) {
                console.error('Error al cargar marcas:', error);
                return [];
            }
        });
    }
    guardarMarca(denominacion, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = id ? `${this.marcasUrl}/${id}` : this.marcasUrl;
            const response = yield fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ denominacion })
            });
            return yield response.json();
        });
    }
    cambiarEstadoMarca(id, activo) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = activo ? `${this.marcasUrl}/${id}/restaurar` : `${this.marcasUrl}/${id}`;
            const response = yield fetch(url, { method: activo ? 'PATCH' : 'DELETE' });
            return response.ok;
        });
    }
    obtenerRubros() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(this.rubrosUrl);
                if (!response.ok)
                    throw new Error('Error al cargar rubros');
                return yield response.json();
            }
            catch (error) {
                console.error('Error al cargar rubros:', error);
                return [];
            }
        });
    }
    guardarRubro(denominacion, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = id ? `${this.rubrosUrl}/${id}` : this.rubrosUrl;
            const response = yield fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ denominacion })
            });
            return yield response.json();
        });
    }
    cambiarEstadoRubro(id, activo) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = activo ? `${this.rubrosUrl}/${id}/restaurar` : `${this.rubrosUrl}/${id}`;
            const response = yield fetch(url, { method: activo ? 'PATCH' : 'DELETE' });
            return response.ok;
        });
    }
}
