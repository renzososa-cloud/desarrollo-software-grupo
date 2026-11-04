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
    }
    // Ahora soporta paginación
    obtenerFacturas() {
        return __awaiter(this, arguments, void 0, function* (page = 0, size = 5) {
            try {
                const response = yield fetch(`${this.baseUrl}?page=${page}&size=${size}`);
                if (!response.ok)
                    throw new Error('Error al cargar facturas');
                return yield response.json(); // Retorna el objeto Page completo
            }
            catch (error) {
                console.error('Error:', error);
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
    // Nuevo método para informar a AFIP
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
}
