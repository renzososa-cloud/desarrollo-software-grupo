var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { FacturaService } from './FacturaService.js';
const facturaService = new FacturaService();
let detallesFactura = [];
let todasLasFacturas = [];
// Variables de paginación
let paginaActual = 0;
let totalPaginas = 1;
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    // === Lógica del Tema Claro/Oscuro ===
    const themeToggle = document.getElementById('themeToggle');
    // Leer preferencia guardada
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }
    themeToggle === null || themeToggle === void 0 ? void 0 : themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        }
        else {
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        }
    });
    // ======================================
    yield cargarFacturas();
    (_a = document.getElementById('btnAgregarItem')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', agregarDetalle);
    (_b = document.getElementById('facturaForm')) === null || _b === void 0 ? void 0 : _b.addEventListener('submit', guardarFactura);
    // Paginación
    (_c = document.getElementById('btnPrevPage')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => cambiarPagina(-1));
    (_d = document.getElementById('btnNextPage')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => cambiarPagina(1));
    // Exportaciones
    (_e = document.getElementById('btnExportarPdf')) === null || _e === void 0 ? void 0 : _e.addEventListener('click', () => {
        window.open('http://localhost:8080/api/facturas/exportar/pdf', '_blank');
    });
    (_f = document.getElementById('btnExportarExcel')) === null || _f === void 0 ? void 0 : _f.addEventListener('click', () => {
        window.open('http://localhost:8080/api/facturas/exportar/excel', '_blank');
    });
    (_g = document.getElementById('btnBuscar')) === null || _g === void 0 ? void 0 : _g.addEventListener('click', () => {
        const termino = document.getElementById('searchInput').value.toLowerCase();
        const filtradas = todasLasFacturas.filter(f => { var _a, _b; return ((_a = f.numeroFactura) === null || _a === void 0 ? void 0 : _a.toString().includes(termino)) ||
            ((_b = f.clienteDenominacion) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(termino)); });
        renderizarTablaFacturas(filtradas);
    });
}));
function cargarFacturas() {
    return __awaiter(this, void 0, void 0, function* () {
        const pageData = yield facturaService.obtenerFacturas(paginaActual, 5);
        todasLasFacturas = pageData.content || [];
        totalPaginas = pageData.totalPages || 1;
        renderizarTablaFacturas(todasLasFacturas);
        actualizarPaginacion();
    });
}
function cambiarPagina(delta) {
    return __awaiter(this, void 0, void 0, function* () {
        paginaActual += delta;
        if (paginaActual < 0)
            paginaActual = 0;
        if (paginaActual >= totalPaginas)
            paginaActual = totalPaginas - 1;
        yield cargarFacturas();
    });
}
function actualizarPaginacion() {
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    const pageInfo = document.getElementById('pageInfo');
    if (btnPrev)
        btnPrev.disabled = paginaActual === 0;
    if (btnNext)
        btnNext.disabled = paginaActual >= totalPaginas - 1;
    if (pageInfo)
        pageInfo.textContent = `Página ${paginaActual + 1} de ${totalPaginas}`;
}
function renderizarTablaFacturas(facturas) {
    const tbody = document.querySelector('#tablaFacturas tbody');
    if (tbody) {
        tbody.innerHTML = '';
        facturas.forEach(f => {
            var _a;
            const esAnulada = f.estado === 'ANULADA';
            const informadaArca = f.cae != null && f.cae !== '';
            const colorEstado = esAnulada ? 'var(--pastel-pink)' : 'var(--pastel-green)';
            const txtEstado = f.estado || 'EMITIDA';
            const txtArca = informadaArca ? f.cae : 'NO INFORMADA';
            // Solución de zona horaria y error TS2339
            let fechaStr = 'N/A';
            if (f.fechaEmision) {
                // Convertimos a string forzosamente para que TypeScript no se queje
                const fechaStringSegura = String(f.fechaEmision);
                const soloFecha = fechaStringSegura.substring(0, 10);
                const partes = soloFecha.split('-');
                if (partes.length === 3) {
                    fechaStr = `${partes[2]}/${partes[1]}/${partes[0]}`;
                }
            }
            tbody.innerHTML += `
                <tr style="${esAnulada ? 'opacity: 0.5;' : ''}">
                    <td>${f.numeroFactura || 'S/N'}</td>
                    <td>${fechaStr}</td>
                    <td><span style="color: ${colorEstado}">${txtEstado}</span></td>
                    <td>$${((_a = f.importeTotal) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || '0.00'}</td>
                    <td>${txtArca}</td>
                    <td>
                        <button class="btn-primary" style="padding: 5px; font-size: 0.8em;" 
                            onclick="informarArca(${f.id})" 
                            ${informadaArca || esAnulada ? 'disabled style="background-color: grey;"' : ''}>
                            ARCA
                        </button>
                        <button class="btn-delete" style="padding: 5px; font-size: 0.8em;" 
                                onclick="eliminarComprobante(${f.id})"
                                ${esAnulada ? 'disabled style="background-color: grey;"' : ''}>
                            Anular
                        </button>
                    </td>
                </tr>
            `;
        });
    }
}
export const informarArca = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (confirm('¿Desea informar esta factura a ARCA? Esta acción no se puede deshacer.')) {
        const exito = yield facturaService.informarArca(id);
        if (exito) {
            alert('Factura informada con éxito. CAE generado.');
            yield cargarFacturas();
        }
        else {
            alert('Error al conectar con ARCA.');
        }
    }
});
window.informarArca = informarArca;
export const eliminarComprobante = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (confirm('¿Está seguro que desea anular esta factura?')) {
        const exito = yield facturaService.eliminarFactura(id);
        if (exito) {
            alert('Factura anulada/eliminada correctamente.');
            yield cargarFacturas();
        }
        else {
            alert('Error al anular la factura.');
        }
    }
});
window.eliminarComprobante = eliminarComprobante;
function agregarDetalle() {
    const selectItem = document.getElementById('listaPrecioArticuloId');
    const inputCantidad = document.getElementById('cantidad');
    const articuloId = parseInt(selectItem.value);
    const cantidad = parseInt(inputCantidad.value);
    const optionText = selectItem.options[selectItem.selectedIndex].text;
    const precioMatch = optionText.match(/\$([0-9.]+)/);
    const precioUnitarioUI = precioMatch ? parseFloat(precioMatch[1]) : 0;
    // Aquí restauré el signo de multiplicar que se había borrado
    const subtotalUI = cantidad * precioUnitarioUI;
    detallesFactura.push({ articuloId, cantidad, porcentajeBonificacion: 0, precioUnitarioUI, subtotalUI });
    actualizarTablaDetalles();
}
function actualizarTablaDetalles() {
    const tbody = document.querySelector('#tablaDetalles tbody');
    let totalVisual = 0;
    if (tbody) {
        tbody.innerHTML = '';
        detallesFactura.forEach((det, index) => {
            totalVisual += det.subtotalUI;
            tbody.innerHTML += `
                <tr>
                    <td>${det.articuloId}</td>
                    <td>${det.cantidad}</td>
                    <td>$${det.precioUnitarioUI.toFixed(2)}</td>
                    <td>$${det.subtotalUI.toFixed(2)}</td>
                    <td><button type="button" class="btn-delete" onclick="eliminarDetalle(${index})">X</button></td>
                </tr>
            `;
        });
    }
    const spanSubtotal = document.getElementById('importeSubtotal');
    const spanTotal = document.getElementById('importeTotal');
    if (spanSubtotal)
        spanSubtotal.textContent = totalVisual.toFixed(2);
    if (spanTotal)
        spanTotal.textContent = totalVisual.toFixed(2);
}
export const eliminarDetalle = (index) => {
    detallesFactura.splice(index, 1);
    actualizarTablaDetalles();
};
window.eliminarDetalle = eliminarDetalle;
function guardarFactura(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (detallesFactura.length === 0) {
            alert('Debe agregar al menos un ítem.');
            return;
        }
        const detallesParaBackend = detallesFactura.map(d => ({ articuloId: d.articuloId, cantidad: d.cantidad, porcentajeBonificacion: d.porcentajeBonificacion }));
        const ahora = new Date();
        const anio = ahora.getFullYear();
        const mesNum = ahora.getMonth() + 1;
        const diaNum = ahora.getDate();
        // Validamos con operador ternario en lugar de padStart para evitar errores de versión en TypeScript
        const mes = mesNum < 10 ? '0' + mesNum : String(mesNum);
        const dia = diaNum < 10 ? '0' + diaNum : String(diaNum);
        const fechaString = `${anio}-${mes}-${dia}`;
        const facturaData = {
            fechaEmision: fechaString,
            puntoVentaId: parseInt(document.getElementById('puntoVentaId').value),
            condicionIvaId: parseInt(document.getElementById('condicionIvaId').value),
            tipoMonedaId: parseInt(document.getElementById('tipoMonedaId').value),
            clienteId: 1,
            observaciones: 'Generada desde UI',
            detalles: detallesParaBackend
        };
        const exito = yield facturaService.crearFactura(facturaData);
        if (exito) {
            alert('Factura emitida con éxito.');
            detallesFactura = [];
            actualizarTablaDetalles();
            // --- Solución al Problema 2: Blanquear los totales de la UI ---
            const spanSubtotal = document.getElementById('importeSubtotal');
            const spanTotal = document.getElementById('importeTotal');
            if (spanSubtotal)
                spanSubtotal.textContent = "0.00";
            if (spanTotal)
                spanTotal.textContent = "0.00";
            // -------------------------------------------------------------
            paginaActual = 0;
            yield cargarFacturas();
        }
        else {
            alert('Error al guardar la factura.');
        }
    });
}
