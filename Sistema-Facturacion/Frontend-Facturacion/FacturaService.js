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
        this.clientesUrl = 'http://localhost:8080/api/clientes'; // NUEVO
    }
    obtenerFacturas() {
        return __awaiter(this, arguments, void 0, function* (page = 0, size = 5, filtros = {}) {
            try {
                const params = new URLSearchParams({
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
                if (filtros.informadaArca !== undefined && filtros.informadaArca !== '') {
                    params.append('informadaArca', filtros.informadaArca);
                }
                const response = yield fetch(`${this.baseUrl}?${params.toString()}`);
                if (!response.ok)
                    throw new Error('Error al cargar facturas');
                return yield response.json();
            }
            catch (error) {
                console.error('Error al cargar facturas:', error);
                return { content: [], totalPages: 0 };
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
                console.error('Error de red:', error);
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
                console.error('Error al eliminar:', error);
                return false;
            }
        });
    }
    informarArca(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/${id}/informar-arca`, { method: 'POST' });
                return response.ok;
            }
            catch (error) {
                console.error('Error al informar a ARCA:', error);
                return false;
            }
        });
    }
    obtenerCatalogo() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(this.catalogoUrl);
                if (!response.ok)
                    throw new Error('Error al cargar catálogo');
                return yield response.json();
            }
            catch (error) {
                console.error('Error al cargar catálogo:', error);
                return [];
            }
        });
    }
    // NUEVO MÉTODO
    obtenerClientes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(this.clientesUrl);
                if (!response.ok)
                    throw new Error('Error al cargar clientes');
                return yield response.json();
            }
            catch (error) {
                console.error('Error al cargar clientes:', error);
                return [];
            }
        });
    }
}
