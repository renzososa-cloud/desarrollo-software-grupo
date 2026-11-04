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
let filtrosActuales = {};
let paginaActual = 0;
let totalPaginas = 1;
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const themeToggle = document.getElementById('themeToggle');
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
    const inputFechaEmision = document.getElementById('fechaEmision');
    if (inputFechaEmision) {
        inputFechaEmision.value = new Date().toLocaleDateString('en-CA');
    }
    const modalCliente = document.getElementById('modalCliente');
    const modalArticulo = document.getElementById('modalArticulo');
    (_a = document.getElementById('btnAbrirModalCliente')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        if (modalCliente)
            modalCliente.style.display = 'flex';
    });
    (_b = document.getElementById('btnAbrirModalArticulo')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        if (modalArticulo)
            modalArticulo.style.display = 'flex';
    });
    (_c = document.getElementById('closeModalCliente')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
        if (modalCliente)
            modalCliente.style.display = 'none';
    });
    (_d = document.getElementById('closeModalArticulo')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => {
        if (modalArticulo)
            modalArticulo.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (modalCliente && e.target === modalCliente)
            modalCliente.style.display = 'none';
        if (modalArticulo && e.target === modalArticulo)
            modalArticulo.style.display = 'none';
    });
    (_e = document.getElementById('searchArticuloModal')) === null || _e === void 0 ? void 0 : _e.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tbodyArticulosModal tr');
        rows.forEach(row => {
            var _a;
            const text = ((_a = row.textContent) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });
    (_f = document.getElementById('searchClienteModal')) === null || _f === void 0 ? void 0 : _f.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tbodyClientesModal tr');
        rows.forEach(row => {
            var _a;
            const text = ((_a = row.textContent) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });
    yield cargarCatalogo();
    yield cargarClientes();
    yield cargarFacturas();
    (_g = document.getElementById('btnAgregarItem')) === null || _g === void 0 ? void 0 : _g.addEventListener('click', agregarDetalle);
    (_h = document.getElementById('facturaForm')) === null || _h === void 0 ? void 0 : _h.addEventListener('submit', guardarFactura);
    (_j = document.getElementById('btnPrevPage')) === null || _j === void 0 ? void 0 : _j.addEventListener('click', () => cambiarPagina(-1));
    (_k = document.getElementById('btnNextPage')) === null || _k === void 0 ? void 0 : _k.addEventListener('click', () => cambiarPagina(1));
    (_l = document.getElementById('btnExportarPdf')) === null || _l === void 0 ? void 0 : _l.addEventListener('click', () => {
        window.open('http://localhost:8080/api/facturas/exportar/pdf', '_blank');
    });
    (_m = document.getElementById('btnExportarExcel')) === null || _m === void 0 ? void 0 : _m.addEventListener('click', () => {
        window.open('http://localhost:8080/api/facturas/exportar/excel', '_blank');
    });
    (_o = document.getElementById('btnBuscar')) === null || _o === void 0 ? void 0 : _o.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const numVal = (_a = document.getElementById('searchNumero')) === null || _a === void 0 ? void 0 : _a.value.trim();
        const fDesdeVal = (_b = document.getElementById('searchFechaDesde')) === null || _b === void 0 ? void 0 : _b.value;
        const fHastaVal = (_c = document.getElementById('searchFechaHasta')) === null || _c === void 0 ? void 0 : _c.value;
        const clienteVal = (_d = document.getElementById('searchCliente')) === null || _d === void 0 ? void 0 : _d.value.trim();
        const estadoArcaVal = (_e = document.getElementById('searchEstadoArca')) === null || _e === void 0 ? void 0 : _e.value;
        filtrosActuales = {
            numero: numVal || undefined,
            fechaDesde: fDesdeVal || undefined,
            fechaHasta: fHastaVal || undefined,
            cliente: clienteVal || undefined,
            informadaArca: estadoArcaVal !== '' ? estadoArcaVal : undefined
        };
        paginaActual = 0;
        yield cargarFacturas();
    }));
}));
function cargarCatalogo() {
    return __awaiter(this, void 0, void 0, function* () {
        const tbodyArticulos = document.getElementById('tbodyArticulosModal');
        const catalogo = yield facturaService.obtenerCatalogo();
        if (!tbodyArticulos || !catalogo || catalogo.length === 0)
            return;
        tbodyArticulos.innerHTML = '';
        catalogo.forEach((art) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td><strong>${art.listaNombre}</strong></td>
            <td>${art.articuloNombre}</td>
            <td>$${art.precioVenta.toFixed(2)}</td>
            <td>
                <button type="button" class="btn-secondary btn-seleccionar-articulo" 
                    data-id="${art.id}" 
                    data-nombre="${art.articuloNombre}" 
                    data-precio="${art.precioVenta}">
                    Elegir
                </button>
            </td>
        `;
            tbodyArticulos.appendChild(tr);
        });
        document.querySelectorAll('.btn-seleccionar-articulo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const id = target.getAttribute('data-id');
                const nombre = target.getAttribute('data-nombre');
                const precio = target.getAttribute('data-precio');
                document.getElementById('articuloIdSelected').value = id || '';
                document.getElementById('articuloNombreSelected').value = nombre || '';
                document.getElementById('articuloPrecioSelected').value = precio || '';
                const modalArticulo = document.getElementById('modalArticulo');
                if (modalArticulo)
                    modalArticulo.style.display = 'none';
            });
        });
    });
}
function cargarClientes() {
    return __awaiter(this, void 0, void 0, function* () {
        const tbodyClientes = document.getElementById('tbodyClientesModal');
        const clientes = yield facturaService.obtenerClientes();
        if (!tbodyClientes || !clientes || clientes.length === 0)
            return;
        tbodyClientes.innerHTML = '';
        clientes.forEach((cli) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td>${cli.id}</td>
            <td>${cli.cuitCuil}</td>
            <td>${cli.denominacion}</td>
            <td>
                <button type="button" class="btn-secondary btn-seleccionar-cliente-dinamico" 
                    data-id="${cli.id}" 
                    data-nombre="${cli.denominacion} (${cli.cuitCuil})">
                    Elegir
                </button>
            </td>
        `;
            tbodyClientes.appendChild(tr);
        });
        document.querySelectorAll('.btn-seleccionar-cliente-dinamico').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const id = target.getAttribute('data-id');
                const nombre = target.getAttribute('data-nombre');
                document.getElementById('clienteId').value = id || '';
                document.getElementById('clienteNombre').value = nombre || '';
                const modalCliente = document.getElementById('modalCliente');
                if (modalCliente)
                    modalCliente.style.display = 'none';
            });
        });
    });
}
function cargarFacturas() {
    return __awaiter(this, void 0, void 0, function* () {
        const pageData = yield facturaService.obtenerFacturas(paginaActual, 5, filtrosActuales);
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
            let fechaStr = 'N/A';
            if (f.fechaEmision) {
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
                        <!-- NUEVO BOTÓN PARA IMPRIMIR PDF DE LA FACTURA ESPECÍFICA -->
                        <button class="btn-secondary" style="padding: 5px; font-size: 0.8em; margin-left: 5px;" 
                                onclick="imprimirFactura(${f.id})"
                                ${!informadaArca ? 'disabled style="background-color: grey;"' : ''}>
                            📄 PDF
                        </button>
                    </td>
                </tr>
            `;
        });
    }
}
// NUEVA FUNCIÓN GLOBAL PARA ABRIR EL PDF
export const imprimirFactura = (id) => {
    window.open(`http://localhost:8080/api/facturas/${id}/pdf`, '_blank');
};
window.imprimirFactura = imprimirFactura;
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
    const inputId = document.getElementById('articuloIdSelected');
    const inputNombre = document.getElementById('articuloNombreSelected');
    const inputPrecio = document.getElementById('articuloPrecioSelected');
    const inputCantidad = document.getElementById('cantidad');
    if (!inputId.value) {
        alert('Debe buscar y seleccionar un artículo haciendo clic en "Buscar".');
        return;
    }
    const articuloId = parseInt(inputId.value);
    const articuloNombre = inputNombre.value;
    const precioUnitarioUI = parseFloat(inputPrecio.value);
    const cantidad = parseInt(inputCantidad.value);
    const subtotalUI = cantidad * precioUnitarioUI;
    detallesFactura.push({
        articuloId,
        articuloNombre,
        cantidad,
        porcentajeBonificacion: 0,
        precioUnitarioUI,
        subtotalUI
    });
    actualizarTablaDetalles();
    inputId.value = '';
    inputNombre.value = '';
    inputPrecio.value = '';
    inputCantidad.value = '1';
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
                    <td><strong>${index + 1}.</strong> ${det.articuloNombre}</td>
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
        const detallesParaBackend = detallesFactura.map(d => ({
            articuloId: d.articuloId,
            cantidad: d.cantidad,
            porcentajeBonificacion: d.porcentajeBonificacion
        }));
        const inputFecha = document.getElementById('fechaEmision').value;
        const fechaString = inputFecha || new Date().toLocaleDateString('en-CA');
        const facturaData = {
            fechaEmision: fechaString,
            puntoVentaId: parseInt(document.getElementById('puntoVentaId').value),
            condicionIvaId: parseInt(document.getElementById('condicionIvaId').value),
            tipoMonedaId: parseInt(document.getElementById('tipoMonedaId').value),
            clienteId: parseInt(document.getElementById('clienteId').value) || 1,
            observaciones: 'Generada desde UI',
            detalles: detallesParaBackend
        };
        const exito = yield facturaService.crearFactura(facturaData);
        if (exito) {
            alert('Factura emitida con éxito.');
            detallesFactura = [];
            actualizarTablaDetalles();
            const spanSubtotal = document.getElementById('importeSubtotal');
            const spanTotal = document.getElementById('importeTotal');
            if (spanSubtotal)
                spanSubtotal.textContent = "0.00";
            if (spanTotal)
                spanTotal.textContent = "0.00";
            paginaActual = 0;
            yield cargarFacturas();
        }
        else {
            alert('Error al guardar la factura.');
        }
    });
}
