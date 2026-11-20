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
// Estado global de navegación y datos
let seccionActual = 'SIN_EMITIR';
let tabFacturacionActual = 'SIN_EMITIR';
let paginaActual = 0;
let tamanioPagina = 10;
let totalPaginas = 1;
let totalElementos = 0;
let filtrosActuales = {};
let listasPrecios = [];
let catalogoCompleto = [];
let clientesLista = [];
let marcasLista = [];
let rubrosLista = [];
let detallesFactura = [];
const formatoMoneda = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});
function formatearPesos(valor) {
    return `$ ${formatoMoneda.format(valor || 0)}`;
}
function completarCeros(valor, longitud) {
    let texto = String(valor);
    while (texto.length < longitud) {
        texto = '0' + texto;
    }
    return texto;
}
function formatearFechaHora(fechaIso) {
    if (!fechaIso)
        return { fecha: '—', hora: '' };
    const texto = String(fechaIso);
    const soloFecha = texto.substring(0, 10);
    const partes = soloFecha.split('-');
    const fecha = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : soloFecha;
    const hora = texto.length >= 16 ? texto.substring(11, 16) : '';
    return { fecha, hora };
}
function mostrarToast(titulo, subtitulo = '', tipo = 'success') {
    var _a;
    const container = document.getElementById('toastContainer');
    if (!container)
        return;
    const toast = document.createElement('div');
    toast.className = `toast-card toast-${tipo}`;
    const icono = tipo === 'success' ? '✓' : tipo === 'warning' ? '!' : '✕';
    toast.innerHTML = `
        <div class="toast-icon">${icono}</div>
        <div class="toast-body">
            <span class="toast-title">${titulo}</span>
            ${subtitulo ? `<span class="toast-subtitle">${subtitulo}</span>` : ''}
        </div>
        <button type="button" class="toast-close" aria-label="Cerrar">&times;</button>
    `;
    const cerrar = () => {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 220);
    };
    (_a = toast.querySelector('.toast-close')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', cerrar);
    container.appendChild(toast);
    setTimeout(cerrar, 3800);
}
function pedirConfirmacion(titulo, mensaje, textoBoton = 'Confirmar', esPeligroso = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modalConfirmacion');
        const elTitulo = document.getElementById('confirmTitulo');
        const elMensaje = document.getElementById('confirmMensaje');
        const btnAceptar = document.getElementById('btnAceptarConfirm');
        const btnCancelar = document.getElementById('btnCancelarConfirm');
        const btnClose = document.getElementById('closeModalConfirmacion');
        elTitulo.textContent = titulo;
        elMensaje.textContent = mensaje;
        btnAceptar.textContent = textoBoton;
        btnAceptar.className = esPeligroso ? 'btn-danger' : 'btn-primary';
        const finalizar = (resultado) => {
            modal.style.display = 'none';
            btnAceptar.onclick = null;
            btnCancelar.onclick = null;
            btnClose.onclick = null;
            resolve(resultado);
        };
        btnAceptar.onclick = () => finalizar(true);
        btnCancelar.onclick = () => finalizar(false);
        btnClose.onclick = () => finalizar(false);
        modal.style.display = 'flex';
    });
}
// =========================================================
// INICIALIZACIÓN
// =========================================================
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    inicializarTema();
    inicializarNavegacionLateral();
    inicializarEventosFacturacion();
    inicializarEventosOperacion();
    yield Promise.all([
        cargarListasPrecios(),
        cargarCatalogo(),
        cargarClientes(),
        cargarMarcas(),
        cargarRubros()
    ]);
    yield cargarFacturas();
}));
function inicializarTema() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        if (themeToggle)
            themeToggle.textContent = '🌙';
    }
    else {
        document.body.classList.add('dark-theme');
        if (themeToggle)
            themeToggle.textContent = '☀️';
    }
    themeToggle === null || themeToggle === void 0 ? void 0 : themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const esOscuro = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', esOscuro ? 'dark' : 'light');
        themeToggle.textContent = esOscuro ? '☀️' : '🌙';
    });
}
function cambiarVistaActiva(nuevaSeccion) {
    seccionActual = nuevaSeccion;
    document.querySelectorAll('#sidebarNav .nav-item').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-section') === nuevaSeccion);
    });
    const vistaFact = document.getElementById('vistaFacturacion');
    const vistaCli = document.getElementById('vistaClientes');
    const vistaArt = document.getElementById('vistaArticulos');
    const vistaMar = document.getElementById('vistaMarcas');
    const vistaRub = document.getElementById('vistaRubros');
    vistaFact.style.display = 'none';
    vistaCli.style.display = 'none';
    vistaArt.style.display = 'none';
    vistaMar.style.display = 'none';
    vistaRub.style.display = 'none';
    if (nuevaSeccion === 'SIN_EMITIR' || nuevaSeccion === 'EMITIDA' || nuevaSeccion === 'ELIMINADAS') {
        tabFacturacionActual = nuevaSeccion;
        vistaFact.style.display = 'block';
        actualizarEncabezadoFacturacion();
        paginaActual = 0;
        cargarFacturas();
    }
    else if (nuevaSeccion === 'CLIENTES') {
        vistaCli.style.display = 'block';
        renderizarTablaClientesOperacion();
    }
    else if (nuevaSeccion === 'ARTICULOS') {
        vistaArt.style.display = 'block';
        renderizarTablaArticulosOperacion();
    }
    else if (nuevaSeccion === 'MARCAS') {
        vistaMar.style.display = 'block';
        renderizarTablaMarcasOperacion();
    }
    else if (nuevaSeccion === 'RUBROS') {
        vistaRub.style.display = 'block';
        renderizarTablaRubrosOperacion();
    }
}
function inicializarNavegacionLateral() {
    var _a, _b, _c, _d, _e, _f;
    document.querySelectorAll('#sidebarNav .nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const sec = target.getAttribute('data-section') || 'SIN_EMITIR';
            cambiarVistaActiva(sec);
        });
    });
    (_a = document.getElementById('btnPrevPage')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        if (paginaActual > 0) {
            paginaActual--;
            yield cargarFacturas();
        }
    }));
    (_b = document.getElementById('btnNextPage')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        if (paginaActual < totalPaginas - 1) {
            paginaActual++;
            yield cargarFacturas();
        }
    }));
    (_c = document.getElementById('selectPageSize')) === null || _c === void 0 ? void 0 : _c.addEventListener('change', (e) => __awaiter(this, void 0, void 0, function* () {
        tamanioPagina = parseInt(e.target.value) || 10;
        paginaActual = 0;
        yield cargarFacturas();
    }));
    (_d = document.getElementById('btnRecargar')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        yield cargarFacturas();
        mostrarToast('Listado actualizado', 'Se sincronizaron los comprobantes con el servidor.');
    }));
    (_e = document.getElementById('btnExportarPdf')) === null || _e === void 0 ? void 0 : _e.addEventListener('click', () => {
        window.open(facturaService.construirUrlExportacion('pdf', tabFacturacionActual, filtrosActuales), '_blank');
    });
    (_f = document.getElementById('btnExportarExcel')) === null || _f === void 0 ? void 0 : _f.addEventListener('click', () => {
        window.open(facturaService.construirUrlExportacion('excel', tabFacturacionActual, filtrosActuales), '_blank');
    });
}
function actualizarEncabezadoFacturacion() {
    const titulo = document.getElementById('tituloSeccion');
    const subtitulo = document.getElementById('subtituloSeccion');
    const thFecha = document.getElementById('thColumnaFecha');
    if (tabFacturacionActual === 'SIN_EMITIR') {
        if (titulo)
            titulo.textContent = 'Sin emitir';
        if (subtitulo)
            subtitulo.textContent = 'Revisá tus facturas y validalas con ARCA cuando estén listas.';
        if (thFecha)
            thFecha.textContent = 'Creación interna';
    }
    else if (tabFacturacionActual === 'EMITIDA') {
        if (titulo)
            titulo.textContent = 'Emitidas';
        if (subtitulo)
            subtitulo.textContent = 'Comprobantes autorizados por ARCA con CAE asignado.';
        if (thFecha)
            thFecha.textContent = 'Emisión';
    }
    else {
        if (titulo)
            titulo.textContent = 'Eliminadas';
        if (subtitulo)
            subtitulo.textContent = 'Borradores dados de baja (los comprobantes emitidos nunca se eliminan).';
        if (thFecha)
            thFecha.textContent = 'Creación interna';
    }
}
// =========================================================
// EVENTOS DE MODALES DE FACTURACIÓN
// =========================================================
function inicializarEventosFacturacion() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const modalFacturaForm = document.getElementById('modalFacturaForm');
    const modalArticulo = document.getElementById('modalArticulo');
    const modalCliente = document.getElementById('modalCliente');
    const modalFiltros = document.getElementById('modalFiltros');
    const modalDetalle = document.getElementById('modalDetalleFactura');
    (_a = document.getElementById('btnNuevaFacturaSidebar')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => abrirModalNuevaFactura());
    (_b = document.getElementById('btnNuevaFacturaHeader')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => abrirModalNuevaFactura());
    (_c = document.getElementById('closeModalFacturaForm')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
        modalFacturaForm.style.display = 'none';
    });
    // Recalcular ítems si cambia la lista de precios de cabecera
    (_d = document.getElementById('listaPrecioId')) === null || _d === void 0 ? void 0 : _d.addEventListener('change', (e) => {
        const nuevaListaId = parseInt(e.target.value);
        if (detallesFactura.length > 0) {
            const actualizados = [];
            for (const item of detallesFactura) {
                const equivalente = catalogoCompleto.find(c => c.listaPrecioId === nuevaListaId && c.articuloId === item.articuloId && c.activo !== false);
                if (equivalente) {
                    const calc = calcularRenglon(equivalente.precioVenta, item.cantidad, item.porcentajeBonificacion);
                    actualizados.push(Object.assign(Object.assign({}, item), { listaPrecioArticuloId: equivalente.id, precioUnitarioUI: equivalente.precioVenta, descuentoMontoUI: calc.descuento, subtotalUI: calc.subtotal }));
                }
            }
            if (actualizados.length < detallesFactura.length) {
                mostrarToast('Lista de precios actualizada', 'Algunos artículos no tenían precio en la nueva lista y fueron omitidos.', 'warning');
            }
            detallesFactura = actualizados;
            actualizarTablaDetalles();
        }
    });
    // Explorer de Artículos
    (_e = document.getElementById('btnAbrirModalArticulo')) === null || _e === void 0 ? void 0 : _e.addEventListener('click', () => {
        const inputSearch = document.getElementById('searchArticuloModal');
        if (inputSearch)
            inputSearch.value = '';
        filtrarYRenderizarCatalogo();
        modalArticulo.style.display = 'flex';
        inputSearch === null || inputSearch === void 0 ? void 0 : inputSearch.focus();
    });
    (_f = document.getElementById('closeModalArticulo')) === null || _f === void 0 ? void 0 : _f.addEventListener('click', () => {
        modalArticulo.style.display = 'none';
    });
    (_g = document.getElementById('searchArticuloModal')) === null || _g === void 0 ? void 0 : _g.addEventListener('input', () => {
        filtrarYRenderizarCatalogo();
    });
    // Explorer de Clientes
    (_h = document.getElementById('btnAbrirModalCliente')) === null || _h === void 0 ? void 0 : _h.addEventListener('click', () => {
        const inputSearch = document.getElementById('searchClienteModal');
        if (inputSearch)
            inputSearch.value = '';
        renderizarTablaClientesExplorer(clientesLista.filter(c => c.activo !== false));
        modalCliente.style.display = 'flex';
        inputSearch === null || inputSearch === void 0 ? void 0 : inputSearch.focus();
    });
    (_j = document.getElementById('closeModalCliente')) === null || _j === void 0 ? void 0 : _j.addEventListener('click', () => {
        modalCliente.style.display = 'none';
    });
    (_k = document.getElementById('btnElegirConsumidorFinal')) === null || _k === void 0 ? void 0 : _k.addEventListener('click', () => {
        document.getElementById('clienteId').value = '';
        document.getElementById('clienteNombre').value = 'Consumidor Final';
        document.getElementById('condicionIvaId').value = '2';
        modalCliente.style.display = 'none';
    });
    (_l = document.getElementById('searchClienteModal')) === null || _l === void 0 ? void 0 : _l.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtrados = clientesLista.filter(c => c.activo !== false && (c.denominacion.toLowerCase().includes(term) ||
            (c.cuitCuil && c.cuitCuil.toLowerCase().includes(term))));
        renderizarTablaClientesExplorer(filtrados);
    });
    // Filtros
    (_m = document.getElementById('btnAbrirFiltros')) === null || _m === void 0 ? void 0 : _m.addEventListener('click', () => {
        document.getElementById('filtroCliente').value = filtrosActuales.cliente || '';
        document.getElementById('filtroNumero').value = filtrosActuales.numero || '';
        document.getElementById('filtroFechaDesde').value = filtrosActuales.fechaDesde || '';
        document.getElementById('filtroFechaHasta').value = filtrosActuales.fechaHasta || '';
        document.getElementById('filtroMontoMinimo').value = filtrosActuales.montoMinimo || '';
        modalFiltros.style.display = 'flex';
    });
    (_o = document.getElementById('closeModalFiltros')) === null || _o === void 0 ? void 0 : _o.addEventListener('click', () => {
        modalFiltros.style.display = 'none';
    });
    (_p = document.getElementById('btnLimpiarModalFiltros')) === null || _p === void 0 ? void 0 : _p.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        document.getElementById('formFiltros').reset();
        filtrosActuales = {};
        actualizarChipsFiltros();
        modalFiltros.style.display = 'none';
        paginaActual = 0;
        yield cargarFacturas();
    }));
    (_q = document.getElementById('btnLimpiarFiltrosRapido')) === null || _q === void 0 ? void 0 : _q.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        filtrosActuales = {};
        actualizarChipsFiltros();
        paginaActual = 0;
        yield cargarFacturas();
    }));
    (_r = document.getElementById('formFiltros')) === null || _r === void 0 ? void 0 : _r.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const cliente = document.getElementById('filtroCliente').value.trim();
        const numero = document.getElementById('filtroNumero').value.trim();
        const fechaDesde = document.getElementById('filtroFechaDesde').value;
        const fechaHasta = document.getElementById('filtroFechaHasta').value;
        const montoMinimo = document.getElementById('filtroMontoMinimo').value.trim();
        filtrosActuales = {
            cliente: cliente || undefined,
            numero: numero || undefined,
            fechaDesde: fechaDesde || undefined,
            fechaHasta: fechaHasta || undefined,
            montoMinimo: montoMinimo || undefined
        };
        actualizarChipsFiltros();
        modalFiltros.style.display = 'none';
        paginaActual = 0;
        yield cargarFacturas();
    }));
    (_s = document.getElementById('closeModalDetalleFactura')) === null || _s === void 0 ? void 0 : _s.addEventListener('click', () => {
        modalDetalle.style.display = 'none';
    });
    (_t = document.getElementById('facturaForm')) === null || _t === void 0 ? void 0 : _t.addEventListener('submit', guardarFactura);
}
// =========================================================
// CARGA DE CATÁLOGOS
// =========================================================
function cargarListasPrecios() {
    return __awaiter(this, void 0, void 0, function* () {
        listasPrecios = yield facturaService.obtenerListasPrecios();
        const select = document.getElementById('listaPrecioId');
        if (!select)
            return;
        select.innerHTML = '';
        listasPrecios.forEach(lp => {
            const opt = document.createElement('option');
            opt.value = lp.id.toString();
            opt.textContent = `${lp.denominacion} (${lp.codigo})`;
            select.appendChild(opt);
        });
    });
}
function cargarCatalogo() {
    return __awaiter(this, void 0, void 0, function* () {
        catalogoCompleto = yield facturaService.obtenerCatalogo();
    });
}
function cargarClientes() {
    return __awaiter(this, void 0, void 0, function* () {
        clientesLista = yield facturaService.obtenerClientes();
    });
}
function cargarMarcas() {
    return __awaiter(this, void 0, void 0, function* () {
        marcasLista = yield facturaService.obtenerMarcas();
    });
}
function cargarRubros() {
    return __awaiter(this, void 0, void 0, function* () {
        rubrosLista = yield facturaService.obtenerRubros();
    });
}
function renderizarTablaClientesExplorer(lista) {
    const tbody = document.getElementById('tbodyClientesModal');
    if (!tbody)
        return;
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center muted-italic">No se encontraron clientes activos.</td></tr>`;
        return;
    }
    lista.forEach(cli => {
        var _a;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cli.id}</td>
            <td>${cli.cuitCuil || '—'}</td>
            <td><strong>${cli.denominacion}</strong></td>
            <td class="text-center">
                <button type="button" class="btn-primary">Elegir</button>
            </td>
        `;
        (_a = tr.querySelector('button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            document.getElementById('clienteId').value = cli.id.toString();
            document.getElementById('clienteNombre').value = cli.cuitCuil
                ? `${cli.denominacion} (${cli.cuitCuil})`
                : cli.denominacion;
            if (cli.condicionIvaId) {
                document.getElementById('condicionIvaId').value = cli.condicionIvaId.toString();
            }
            if (cli.listaPrecioPredeterminadaId) {
                const selectLista = document.getElementById('listaPrecioId');
                selectLista.value = cli.listaPrecioPredeterminadaId.toString();
                selectLista.dispatchEvent(new Event('change'));
            }
            const modalCliente = document.getElementById('modalCliente');
            if (modalCliente)
                modalCliente.style.display = 'none';
        });
        tbody.appendChild(tr);
    });
}
function filtrarYRenderizarCatalogo() {
    const tbody = document.getElementById('tbodyArticulosModal');
    const contador = document.getElementById('contadorArticulosModal');
    const badgeLista = document.getElementById('badgeListaActivaExplorer');
    const inputSearch = document.getElementById('searchArticuloModal');
    const selectLista = document.getElementById('listaPrecioId');
    const listaSeleccionadaId = parseInt((selectLista === null || selectLista === void 0 ? void 0 : selectLista.value) || '1');
    const listaObj = listasPrecios.find(l => l.id === listaSeleccionadaId);
    if (badgeLista && listaObj) {
        badgeLista.textContent = `${listaObj.denominacion} (${listaObj.codigo})`;
        badgeLista.className = listaObj.codigo.toUpperCase().indexOf('MAYORISTA') !== -1
            ? 'badge-lista badge-mayorista'
            : 'badge-lista badge-minorista';
    }
    const termino = inputSearch ? inputSearch.value.toLowerCase().trim() : '';
    const filtrados = catalogoCompleto.filter(art => {
        const coincideLista = art.listaPrecioId === listaSeleccionadaId && art.activo !== false;
        const coincideTexto = art.articuloNombre.toLowerCase().indexOf(termino) !== -1 ||
            (art.articuloCodigo && art.articuloCodigo.toLowerCase().indexOf(termino) !== -1);
        return coincideLista && coincideTexto;
    });
    if (!tbody)
        return;
    tbody.innerHTML = '';
    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center muted-italic">No hay artículos disponibles para esta lista de precios.</td></tr>`;
    }
    else {
        filtrados.forEach(art => {
            var _a;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="item-code">${art.articuloCodigo || 'ART-' + completarCeros(art.articuloId, 6)}</span></td>
                <td><strong>${art.articuloNombre}</strong></td>
                <td>${art.listaNombre}</td>
                <td class="text-right"><strong>${formatearPesos(art.precioVenta)}</strong></td>
                <td class="text-center">
                    <button type="button" class="btn-primary">+ Agregar</button>
                </td>
            `;
            const agregarEsteArticulo = () => {
                const existente = detallesFactura.find(d => d.listaPrecioArticuloId === art.id);
                if (existente) {
                    existente.cantidad += 1;
                    const calc = calcularRenglon(existente.precioUnitarioUI, existente.cantidad, existente.porcentajeBonificacion);
                    existente.descuentoMontoUI = calc.descuento;
                    existente.subtotalUI = calc.subtotal;
                }
                else {
                    const calc = calcularRenglon(art.precioVenta, 1, 0);
                    detallesFactura.push({
                        listaPrecioArticuloId: art.id,
                        articuloId: art.articuloId,
                        articuloCodigo: art.articuloCodigo || `ART-${completarCeros(art.articuloId, 6)}`,
                        articuloNombre: art.articuloNombre,
                        cantidad: 1,
                        porcentajeBonificacion: 0,
                        precioUnitarioUI: art.precioVenta,
                        descuentoMontoUI: calc.descuento,
                        subtotalUI: calc.subtotal
                    });
                }
                actualizarTablaDetalles();
                const modalArticulo = document.getElementById('modalArticulo');
                if (modalArticulo)
                    modalArticulo.style.display = 'none';
            };
            (_a = tr.querySelector('button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', agregarEsteArticulo);
            tr.addEventListener('dblclick', agregarEsteArticulo);
            tbody.appendChild(tr);
        });
    }
    if (contador) {
        contador.textContent = `Mostrando ${filtrados.length} artículos de la lista seleccionada`;
    }
}
// =========================================================
// CÁLCULO Y RENDERIZADO DE ÍTEMS (FACTURA C - SIN IVA)
// =========================================================
function calcularRenglon(precioUnitario, cantidad, porcentajeBonif) {
    const bruto = precioUnitario * cantidad;
    const descuento = Math.round(bruto * (porcentajeBonif / 100) * 100) / 100;
    const subtotal = Math.round((bruto - descuento) * 100) / 100;
    return { descuento, subtotal };
}
function actualizarTablaDetalles() {
    const tbody = document.getElementById('tbodyDetalles');
    const spanTotal = document.getElementById('importeTotal');
    let totalGeneral = 0;
    if (!tbody)
        return;
    tbody.innerHTML = '';
    if (detallesFactura.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center muted-italic" style="padding: 24px;">No hay artículos cargados. Haga clic en "+ Agregar artículo".</td></tr>`;
    }
    else {
        detallesFactura.forEach((det, index) => {
            var _a;
            totalGeneral += det.subtotalUI;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="item-code">${det.articuloCodigo}</span>
                    <span class="item-name">${det.articuloNombre}</span>
                    <span class="item-sub">Artículo ${det.articuloId} · Precio lista ${det.listaPrecioArticuloId}</span>
                </td>
                <td class="text-right">
                    <span class="cell-main-val">${formatearPesos(det.precioUnitarioUI)}</span>
                    <span class="cell-sub-val">por unidad</span>
                </td>
                <td class="text-center">
                    <input type="number" class="inline-num-input input-cant-item" min="1" step="1" value="${det.cantidad}">
                    <span class="cell-sub-val">unidades</span>
                </td>
                <td class="text-center">
                    <div class="bonif-wrapper">
                        <input type="number" class="inline-num-input input-bonif-item" min="0" max="100" step="0.5" value="${det.porcentajeBonificacion}">
                        <span>%</span>
                    </div>
                    <span class="cell-sub-val">- ${formatearPesos(det.descuentoMontoUI)}</span>
                </td>
                <td class="text-right">
                    <span class="cell-main-val">${formatearPesos(det.subtotalUI)}</span>
                    <span class="cell-sub-val">total del renglón</span>
                </td>
                <td class="text-center">
                    <button type="button" class="btn-trash-circle" title="Quitar ítem">🗑️</button>
                </td>
            `;
            const inputCant = tr.querySelector('.input-cant-item');
            inputCant === null || inputCant === void 0 ? void 0 : inputCant.addEventListener('change', () => {
                let nuevaCant = parseFloat(inputCant.value);
                if (isNaN(nuevaCant) || nuevaCant <= 0)
                    nuevaCant = 1;
                det.cantidad = nuevaCant;
                const calc = calcularRenglon(det.precioUnitarioUI, det.cantidad, det.porcentajeBonificacion);
                det.descuentoMontoUI = calc.descuento;
                det.subtotalUI = calc.subtotal;
                actualizarTablaDetalles();
            });
            const inputBonif = tr.querySelector('.input-bonif-item');
            inputBonif === null || inputBonif === void 0 ? void 0 : inputBonif.addEventListener('change', () => {
                let nuevaBonif = parseFloat(inputBonif.value);
                if (isNaN(nuevaBonif) || nuevaBonif < 0)
                    nuevaBonif = 0;
                if (nuevaBonif > 100)
                    nuevaBonif = 100;
                det.porcentajeBonificacion = nuevaBonif;
                const calc = calcularRenglon(det.precioUnitarioUI, det.cantidad, det.porcentajeBonificacion);
                det.descuentoMontoUI = calc.descuento;
                det.subtotalUI = calc.subtotal;
                actualizarTablaDetalles();
            });
            (_a = tr.querySelector('.btn-trash-circle')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
                detallesFactura.splice(index, 1);
                actualizarTablaDetalles();
            });
            tbody.appendChild(tr);
        });
    }
    if (spanTotal) {
        spanTotal.textContent = formatearPesos(totalGeneral);
    }
}
// =========================================================
// CREAR / EDITAR FACTURA (SIN EMITIR)
// =========================================================
function abrirModalNuevaFactura() {
    document.getElementById('editFacturaId').value = '';
    document.getElementById('tituloModalFactura').textContent = 'Nueva factura';
    document.getElementById('metaNumeroFactura').textContent = 'Se asigna al emitir';
    document.getElementById('metaFechaFactura').textContent = 'Se asigna al emitir';
    document.getElementById('btnGuardarFactura').textContent = '✓ Guardar sin emitir';
    document.getElementById('puntoVentaId').value = '1';
    document.getElementById('clienteId').value = '';
    document.getElementById('clienteNombre').value = 'Consumidor Final';
    document.getElementById('condicionIvaId').value = '2';
    document.getElementById('tipoMonedaId').value = '1';
    document.getElementById('observaciones').value = '';
    if (listasPrecios.length > 0) {
        document.getElementById('listaPrecioId').value = listasPrecios[0].id.toString();
    }
    detallesFactura = [];
    actualizarTablaDetalles();
    const modal = document.getElementById('modalFacturaForm');
    modal.style.display = 'flex';
}
export const abrirModalEditarFactura = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const factura = yield facturaService.obtenerFacturaPorId(id);
    if (!factura) {
        mostrarToast('Error al cargar', 'No se pudo obtener la factura para editar.', 'error');
        return;
    }
    if (factura.estado === 'EMITIDA' || factura.cae) {
        mostrarToast('Operación no permitida', 'Los comprobantes emitidos con CAE no pueden editarse.', 'error');
        return;
    }
    document.getElementById('editFacturaId').value = factura.id.toString();
    document.getElementById('tituloModalFactura').textContent = `Editar factura #${factura.id}`;
    document.getElementById('metaNumeroFactura').textContent = factura.numero ? String(factura.numero) : 'Se asigna al emitir';
    const fCreacion = formatearFechaHora(factura.fechaCreacionInterna);
    document.getElementById('metaFechaFactura').textContent = `${fCreacion.fecha} ${fCreacion.hora}`.trim();
    document.getElementById('btnGuardarFactura').textContent = '✓ Guardar cambios';
    document.getElementById('puntoVentaId').value = String(factura.puntoVentaId || 1);
    document.getElementById('clienteId').value = factura.clienteId ? String(factura.clienteId) : '';
    document.getElementById('clienteNombre').value = factura.clienteDenominacion || 'Consumidor Final';
    document.getElementById('condicionIvaId').value = String(factura.condicionIvaId || 2);
    document.getElementById('tipoMonedaId').value = String(factura.tipoMonedaId || 1);
    document.getElementById('observaciones').value = factura.observaciones || '';
    const listaId = factura.listaPrecioId || ((_a = factura.detalles[0]) === null || _a === void 0 ? void 0 : _a.listaPrecioId) || 1;
    document.getElementById('listaPrecioId').value = String(listaId);
    detallesFactura = factura.detalles.map(d => {
        const calc = calcularRenglon(d.precioUnitario, d.cantidad, d.porcentajeBonificacion);
        return {
            listaPrecioArticuloId: d.listaPrecioArticuloId,
            articuloId: d.articuloId,
            articuloCodigo: d.articuloCodigo || `ART-${completarCeros(d.articuloId, 6)}`,
            articuloNombre: d.articuloDenominacion || d.descripcion,
            cantidad: d.cantidad,
            porcentajeBonificacion: d.porcentajeBonificacion,
            precioUnitarioUI: d.precioUnitario,
            descuentoMontoUI: calc.descuento,
            subtotalUI: d.importeSubtotal
        };
    });
    actualizarTablaDetalles();
    const modalDetalle = document.getElementById('modalDetalleFactura');
    if (modalDetalle)
        modalDetalle.style.display = 'none';
    const modalForm = document.getElementById('modalFacturaForm');
    modalForm.style.display = 'flex';
});
window.abrirModalEditarFactura = abrirModalEditarFactura;
function guardarFactura(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (detallesFactura.length === 0) {
            mostrarToast('Comprobante incompleto', 'Agregá al menos un artículo antes de guardar.', 'warning');
            return;
        }
        const editIdStr = document.getElementById('editFacturaId').value;
        const clienteIdStr = document.getElementById('clienteId').value;
        const payload = {
            puntoVentaId: parseInt(document.getElementById('puntoVentaId').value),
            clienteId: clienteIdStr ? parseInt(clienteIdStr) : null,
            listaPrecioId: parseInt(document.getElementById('listaPrecioId').value),
            condicionIvaId: parseInt(document.getElementById('condicionIvaId').value),
            tipoMonedaId: parseInt(document.getElementById('tipoMonedaId').value),
            observaciones: document.getElementById('observaciones').value.trim(),
            detalles: detallesFactura.map(d => ({
                listaPrecioArticuloId: d.listaPrecioArticuloId,
                cantidad: d.cantidad,
                porcentajeBonificacion: d.porcentajeBonificacion
            }))
        };
        const btnSubmit = document.getElementById('btnGuardarFactura');
        btnSubmit.disabled = true;
        const exito = editIdStr
            ? yield facturaService.actualizarFactura(parseInt(editIdStr), payload)
            : yield facturaService.crearFactura(payload);
        btnSubmit.disabled = false;
        if (exito) {
            const modal = document.getElementById('modalFacturaForm');
            modal.style.display = 'none';
            if (editIdStr) {
                mostrarToast(`Borrador #${editIdStr} actualizado`, 'Los cambios se guardaron correctamente.');
            }
            else {
                mostrarToast('Factura Guardada Sin Emitir', 'Ya podés validarla con ARCA desde Sin emitir.');
            }
            cambiarVistaActiva('SIN_EMITIR');
        }
        else {
            mostrarToast('Error al guardar', 'Verificá los datos del comprobante e intentá nuevamente.', 'error');
        }
    });
}
// =========================================================
// GRILLA PRINCIPAL, PAGINACIÓN Y ACCIONES
// =========================================================
function cargarFacturas() {
    return __awaiter(this, void 0, void 0, function* () {
        const pageData = yield facturaService.obtenerFacturas(tabFacturacionActual, paginaActual, tamanioPagina, filtrosActuales);
        const facturas = pageData.content || [];
        totalPaginas = Math.max(pageData.totalPages || 1, 1);
        totalElementos = pageData.totalElements || 0;
        renderizarTablaFacturas(facturas);
        actualizarPaginacion(facturas.length);
    });
}
function actualizarPaginacion(cantidadEnPagina) {
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    const pageInfo = document.getElementById('pageInfo');
    const rangoSpan = document.getElementById('rangoRegistros');
    if (btnPrev)
        btnPrev.disabled = paginaActual === 0;
    if (btnNext)
        btnNext.disabled = paginaActual >= totalPaginas - 1;
    if (pageInfo)
        pageInfo.textContent = `Página ${paginaActual + 1} de ${totalPaginas}`;
    if (rangoSpan) {
        if (totalElementos === 0) {
            rangoSpan.textContent = '0–0 de 0';
        }
        else {
            const desde = paginaActual * tamanioPagina + 1;
            const hasta = desde + cantidadEnPagina - 1;
            rangoSpan.textContent = `${desde}–${hasta} de ${totalElementos}`;
        }
    }
}
function renderizarTablaFacturas(facturas) {
    const tbody = document.getElementById('tbodyFacturas');
    if (!tbody)
        return;
    tbody.innerHTML = '';
    if (facturas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center muted-italic" style="padding: 32px;">No hay comprobantes para mostrar en esta sección.</td></tr>`;
        return;
    }
    facturas.forEach(f => {
        var _a;
        const esEmitida = f.estado === 'EMITIDA' && !f.eliminada;
        const esEliminada = f.eliminada || f.estado === 'ANULADA';
        const numeroHtml = f.numeroFactura != null
            ? `<strong>${f.numeroFactura}</strong>`
            : `<span class="muted-italic">Sin asignar</span>`;
        const fechaRef = tabFacturacionActual === 'EMITIDA' ? f.fechaEmision : f.fechaCreacionInterna;
        const { fecha, hora } = formatearFechaHora(fechaRef);
        let badgeEstado = `<span class="status-pill status-sin-emitir">Sin emitir</span>`;
        if (esEliminada) {
            badgeEstado = `<span class="status-pill status-eliminada">Eliminada</span>`;
        }
        else if (esEmitida) {
            badgeEstado = `<span class="status-pill status-emitida">Emitida</span>`;
        }
        // REGLA FISCAL:
        // - Sin emitir: Ver, Editar, Emitir (ARCA), Eliminar
        // - Emitidas (con CAE): ÚNICAMENTE Ver y PDF (nunca editar ni eliminar)
        // - Eliminadas (borradores dados de baja): Ver, Restaurar, Eliminar definitivo
        let botonesAccion = `<button type="button" class="btn-row" onclick="verDetalleFactura(${f.id})" title="Ver detalle">👁 Ver</button>`;
        if (!esEmitida && !esEliminada) {
            botonesAccion += `
                <button type="button" class="btn-row" onclick="abrirModalEditarFactura(${f.id})" title="Editar borrador">✏️ Editar</button>
                <button type="button" class="btn-row btn-row-emitir" onclick="informarArca(${f.id}, ${f.importeTotal})" title="Autorizar en ARCA">🚀 Emitir</button>
                <button type="button" class="btn-row btn-row-delete" onclick="eliminarComprobante(${f.id})" title="Mover a Eliminadas">🗑️</button>
            `;
        }
        else if (esEmitida && !esEliminada) {
            botonesAccion += `
                <button type="button" class="btn-row" onclick="imprimirFactura(${f.id})" title="Descargar PDF">📄 PDF</button>
            `;
        }
        else if (esEliminada) {
            botonesAccion += `
                <button type="button" class="btn-row btn-row-emitir" onclick="restaurarComprobante(${f.id})" title="Restaurar a Sin emitir">↩ Restaurar</button>
                <button type="button" class="btn-row btn-row-delete" onclick="eliminarComprobanteDefinitivo(${f.id})" title="Eliminar definitivamente">🗑️</button>
            `;
        }
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${f.id}</td>
            <td>${numeroHtml}</td>
            <td>
                <span class="date-cell-main">${fecha}</span>
                ${hora ? `<span class="date-cell-sub">${hora}</span>` : ''}
            </td>
            <td><strong>${f.clienteDenominacion || 'Consumidor Final'}</strong></td>
            <td>${f.condicionIva || 'Consumidor Final'}</td>
            <td>${f.puntoVentaDescripcion || 'Sucursal Central'}</td>
            <td class="text-right"><strong>${formatearPesos(f.importeTotal)}</strong></td>
            <td class="text-center">${(_a = f.cantidadItems) !== null && _a !== void 0 ? _a : 0}</td>
            <td>${badgeEstado}</td>
            <td class="text-right">
                <div class="row-actions">${botonesAccion}</div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
function actualizarChipsFiltros() {
    const bar = document.getElementById('activeFiltersBar');
    const chipsContainer = document.getElementById('activeFiltersChips');
    const badge = document.getElementById('badgeFiltrosActivos');
    const entries = [];
    if (filtrosActuales.cliente)
        entries.push(`Cliente: ${filtrosActuales.cliente}`);
    if (filtrosActuales.numero)
        entries.push(`N.º: ${filtrosActuales.numero}`);
    if (filtrosActuales.fechaDesde)
        entries.push(`Desde: ${filtrosActuales.fechaDesde}`);
    if (filtrosActuales.fechaHasta)
        entries.push(`Hasta: ${filtrosActuales.fechaHasta}`);
    if (filtrosActuales.montoMinimo)
        entries.push(`Monto ≥ $${filtrosActuales.montoMinimo}`);
    if (entries.length === 0) {
        bar.style.display = 'none';
        badge.style.display = 'none';
    }
    else {
        bar.style.display = 'flex';
        badge.style.display = 'inline-block';
        badge.textContent = String(entries.length);
        chipsContainer.innerHTML = entries.map(txt => `<span class="filter-chip">${txt}</span>`).join('');
    }
}
// =========================================================
// ACCIONES SOBRE COMPROBANTES
// =========================================================
export const verDetalleFactura = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const f = yield facturaService.obtenerFacturaPorId(id);
    if (!f) {
        mostrarToast('Error', 'No se pudo cargar el detalle del comprobante.', 'error');
        return;
    }
    const modal = document.getElementById('modalDetalleFactura');
    const titulo = document.getElementById('detalleTitulo');
    const estadoBadge = document.getElementById('detalleEstadoBadge');
    const body = document.getElementById('detalleBodyContent');
    const esEmitida = f.estado === 'EMITIDA' && Boolean(f.cae);
    const esEliminada = tabFacturacionActual === 'ELIMINADAS' || f.estado === 'ANULADA';
    titulo.textContent = f.numero
        ? `Factura ${completarCeros(f.puntoVentaNumero, 4)}-${completarCeros(f.numero, 8)}`
        : `Borrador #${f.id}`;
    if (esEliminada) {
        estadoBadge.textContent = 'Eliminada';
        estadoBadge.className = 'status-pill status-eliminada';
    }
    else if (esEmitida) {
        estadoBadge.textContent = 'Emitida';
        estadoBadge.className = 'status-pill status-emitida';
    }
    else {
        estadoBadge.textContent = 'Sin emitir';
        estadoBadge.className = 'status-pill status-sin-emitir';
    }
    const fCreacion = formatearFechaHora(f.fechaCreacionInterna);
    const fEmision = formatearFechaHora(f.fechaEmision);
    const filasHtml = f.detalles.map(d => `
        <tr>
            <td>
                <span class="item-code">${d.articuloCodigo || 'ART-' + completarCeros(d.articuloId, 6)}</span>
                <span class="item-name">${d.articuloDenominacion || d.descripcion}</span>
                <span class="item-sub">Artículo ${d.articuloId} · Precio lista ${d.listaPrecioArticuloId}</span>
            </td>
            <td class="text-right">${formatearPesos(d.precioUnitario)}</td>
            <td class="text-center">${d.cantidad}</td>
            <td class="text-center">${d.porcentajeBonificacion}%</td>
            <td class="text-right"><strong>${formatearPesos(d.importeSubtotal)}</strong></td>
        </tr>
    `).join('');
    const bannerFiscal = esEliminada
        ? `<div class="draft-banner" style="border-color: rgba(239, 68, 68, 0.4); background-color: rgba(239, 68, 68, 0.12);">
                <div>
                    <strong>🗑️ Borrador dado de baja</strong><br>
                    <span style="font-size: 0.85rem;">Podés restaurarlo a Sin emitir o eliminarlo definitivamente.</span>
                </div>
                <button type="button" class="btn-primary" onclick="restaurarComprobante(${f.id}, true)">↩ Restaurar</button>
           </div>`
        : esEmitida
            ? `<div class="cae-fiscal-banner">
                <div>
                    <strong>✅ Comprobante autorizado por ARCA (${f.resultadoAfip || 'A · Aprobada con CAE'})</strong><br>
                    <span style="font-size: 0.85rem;">CAE: <strong>${f.cae}</strong> · Vencimiento CAE: <strong>${f.caeFechaVencimiento || '—'}</strong></span>
                </div>
                <button type="button" class="btn-primary" onclick="imprimirFactura(${f.id})">📄 Imprimir / PDF</button>
           </div>`
            : `<div class="draft-banner">
                <div>
                    <strong>🕒 Borrador pendiente de emisión fiscal</strong><br>
                    <span style="font-size: 0.85rem;">Podés editar sus ítems o validarlo con ARCA para obtener el CAE oficial.</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn-outline" onclick="abrirModalEditarFactura(${f.id})">✏️ Editar</button>
                    <button type="button" class="btn-primary" onclick="informarArca(${f.id}, ${f.importeTotal}, true)">🚀 Validar y emitir</button>
                </div>
           </div>`;
    body.innerHTML = `
        <div class="invoice-meta-grid">
            <div class="meta-field">
                <span class="meta-label">Número fiscal</span>
                <span class="meta-value">${(_a = f.numero) !== null && _a !== void 0 ? _a : 'Se asigna al emitir'}</span>
            </div>
            <div class="meta-field">
                <span class="meta-label">Creación interna</span>
                <span class="meta-value">${fCreacion.fecha} ${fCreacion.hora}</span>
            </div>
            <div class="meta-field">
                <span class="meta-label">Fecha de emisión</span>
                <span class="meta-value">${esEmitida ? `${fEmision.fecha} ${fEmision.hora}` : 'Pendiente'}</span>
            </div>
            <div class="meta-field">
                <span class="meta-label">Punto de venta</span>
                <span class="meta-value">${f.puntoVentaNumero} - ${f.puntoVentaDescripcion}</span>
            </div>
            <div class="meta-field">
                <span class="meta-label">Cliente</span>
                <span class="meta-value">${f.clienteDenominacion}${f.clienteCuitCuil ? ` (${f.clienteCuitCuil})` : ''}</span>
            </div>
            <div class="meta-field">
                <span class="meta-label">Lista de precios</span>
                <span class="meta-value">${f.listaPrecio || '—'}</span>
            </div>
            <div class="meta-field">
                <span class="meta-label">Condición de IVA</span>
                <span class="meta-value">${f.condicionIva}</span>
            </div>
            <div class="meta-field">
                <span class="meta-label">Moneda</span>
                <span class="meta-value">${f.tipoMoneda}</span>
            </div>
            <div class="meta-field meta-span-full">
                <span class="meta-label">Observaciones</span>
                <span class="meta-value">${f.observaciones || 'Sin observaciones'}</span>
            </div>
        </div>

        <div class="items-section">
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Artículo</th>
                        <th class="text-right">Precio unitario</th>
                        <th class="text-center">Cantidad</th>
                        <th class="text-center">Bonificación</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>${filasHtml}</tbody>
            </table>

            <div class="invoice-total-footer">
                <span class="total-label">Total del comprobante</span>
                <span class="total-amount">${formatearPesos(f.importeTotal)}</span>
            </div>
        </div>

        ${bannerFiscal}
    `;
    modal.style.display = 'flex';
});
window.verDetalleFactura = verDetalleFactura;
export const informarArca = (id_1, ...args_1) => __awaiter(void 0, [id_1, ...args_1], void 0, function* (id, monto = 0, desdeModalDetalle = false) {
    var _a;
    const confirmado = yield pedirConfirmacion('Emitir factura', 'Se validará el comprobante con ARCA y, si es aprobado, se le asignará número oficial y CAE. Una vez emitida no podrá editarse ni eliminarse.', monto > 0 ? `🚀 Emitir · ${formatearPesos(monto)}` : '🚀 Emitir ahora', false);
    if (!confirmado)
        return;
    const res = yield facturaService.informarArca(id);
    if (res.ok) {
        const sub = ((_a = res.data) === null || _a === void 0 ? void 0 : _a.cae)
            ? `Comprobante ${res.data.numero} · CAE: ${res.data.cae}`
            : 'Comprobante autorizado con CAE oficial.';
        mostrarToast('Factura Emitida Por ARCA', sub, 'success');
        if (desdeModalDetalle) {
            const modalDetalle = document.getElementById('modalDetalleFactura');
            if (modalDetalle)
                modalDetalle.style.display = 'none';
        }
        yield cargarFacturas();
    }
    else {
        mostrarToast('Rechazo o error de emisión', res.mensaje || 'No se pudo validar en ARCA.', 'error');
    }
});
window.informarArca = informarArca;
export const eliminarComprobante = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const confirmado = yield pedirConfirmacion('Eliminar factura', `El borrador #${id} se dará de baja sin borrar sus datos y aparecerá en Eliminadas.`, '🗑️ Confirmar', true);
    if (!confirmado)
        return;
    const exito = yield facturaService.eliminarFactura(id);
    if (exito) {
        mostrarToast('Factura Dada De Baja', `Borrador #${id} ahora aparece en Eliminadas.`, 'success');
        yield cargarFacturas();
    }
    else {
        mostrarToast('Error al eliminar', 'No se pudo dar de baja el borrador.', 'error');
    }
});
window.eliminarComprobante = eliminarComprobante;
export const restaurarComprobante = (id_1, ...args_1) => __awaiter(void 0, [id_1, ...args_1], void 0, function* (id, desdeModalDetalle = false) {
    const exito = yield facturaService.restaurarFactura(id);
    if (exito) {
        mostrarToast('Factura Restaurada', `El borrador #${id} volvió a Sin emitir.`, 'success');
        if (desdeModalDetalle) {
            const modalDetalle = document.getElementById('modalDetalleFactura');
            if (modalDetalle)
                modalDetalle.style.display = 'none';
        }
        yield cargarFacturas();
    }
    else {
        mostrarToast('Atención', 'Agregá el endpoint PUT /api/facturas/{id}/restaurar en el backend para restaurar borradores.', 'warning');
    }
});
window.restaurarComprobante = restaurarComprobante;
export const eliminarComprobanteDefinitivo = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const confirmado = yield pedirConfirmacion('Eliminar definitivamente', `El borrador #${id} y sus detalles se eliminarán definitivamente. Esta acción no se puede deshacer.`, '🗑️ Eliminar definitivamente', true);
    if (!confirmado)
        return;
    const exito = yield facturaService.eliminarFacturaDefinitiva(id);
    if (exito) {
        mostrarToast('Borrador eliminado definitivamente', `Borrador #${id} eliminado.`, 'success');
        yield cargarFacturas();
    }
    else {
        mostrarToast('Atención', 'Agregá el endpoint DELETE /api/facturas/{id}/definitivo en el backend.', 'warning');
    }
});
window.eliminarComprobanteDefinitivo = eliminarComprobanteDefinitivo;
export const imprimirFactura = (id) => {
    window.open(`http://localhost:8080/api/facturas/${id}/pdf`, '_blank');
};
window.imprimirFactura = imprimirFactura;
// =========================================================
// SECCIÓN OPERACIÓN: CLIENTES, ARTÍCULOS, MARCAS Y RUBROS
// =========================================================
function inicializarEventosOperacion() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    // --- CLIENTES ---
    (_a = document.getElementById('btnNuevoCliente')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => abrirModalClienteOp());
    (_b = document.getElementById('closeModalClienteOp')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        document.getElementById('modalFormClienteOp').style.display = 'none';
    });
    (_c = document.getElementById('inputBuscarClienteOp')) === null || _c === void 0 ? void 0 : _c.addEventListener('input', renderizarTablaClientesOperacion);
    (_d = document.getElementById('filtroEstadoClienteOp')) === null || _d === void 0 ? void 0 : _d.addEventListener('change', renderizarTablaClientesOperacion);
    (_e = document.getElementById('ordenClienteOp')) === null || _e === void 0 ? void 0 : _e.addEventListener('change', renderizarTablaClientesOperacion);
    (_f = document.getElementById('formClienteOp')) === null || _f === void 0 ? void 0 : _f.addEventListener('submit', guardarClienteOperacion);
    // --- ARTÍCULOS ---
    (_g = document.getElementById('btnNuevoArticuloOp')) === null || _g === void 0 ? void 0 : _g.addEventListener('click', () => abrirModalArticuloOp());
    (_h = document.getElementById('closeModalArticuloOp')) === null || _h === void 0 ? void 0 : _h.addEventListener('click', () => {
        document.getElementById('modalFormArticuloOp').style.display = 'none';
    });
    (_j = document.getElementById('inputBuscarArticuloOp')) === null || _j === void 0 ? void 0 : _j.addEventListener('input', renderizarTablaArticulosOperacion);
    (_k = document.getElementById('filtroEstadoArticuloOp')) === null || _k === void 0 ? void 0 : _k.addEventListener('change', renderizarTablaArticulosOperacion);
    (_l = document.getElementById('filtroListaArticuloOp')) === null || _l === void 0 ? void 0 : _l.addEventListener('change', renderizarTablaArticulosOperacion);
    const chkMin = document.getElementById('chkListaMinorista');
    const inpMin = document.getElementById('inputPrecioMinorista');
    chkMin === null || chkMin === void 0 ? void 0 : chkMin.addEventListener('change', () => {
        inpMin.disabled = !chkMin.checked;
        if (!chkMin.checked)
            inpMin.value = '';
    });
    const chkMay = document.getElementById('chkListaMayorista');
    const inpMay = document.getElementById('inputPrecioMayorista');
    chkMay === null || chkMay === void 0 ? void 0 : chkMay.addEventListener('change', () => {
        inpMay.disabled = !chkMay.checked;
        if (!chkMay.checked)
            inpMay.value = '';
    });
    (_m = document.getElementById('formArticuloOp')) === null || _m === void 0 ? void 0 : _m.addEventListener('submit', guardarArticuloOperacion);
    // --- MARCAS ---
    (_o = document.getElementById('btnNuevaMarcaOp')) === null || _o === void 0 ? void 0 : _o.addEventListener('click', () => abrirModalMarcaOp());
    (_p = document.getElementById('closeModalMarcaOp')) === null || _p === void 0 ? void 0 : _p.addEventListener('click', () => {
        document.getElementById('modalFormMarcaOp').style.display = 'none';
    });
    (_q = document.getElementById('inputBuscarMarcaOp')) === null || _q === void 0 ? void 0 : _q.addEventListener('input', renderizarTablaMarcasOperacion);
    (_r = document.getElementById('filtroEstadoMarcaOp')) === null || _r === void 0 ? void 0 : _r.addEventListener('change', renderizarTablaMarcasOperacion);
    (_s = document.getElementById('formMarcaOp')) === null || _s === void 0 ? void 0 : _s.addEventListener('submit', guardarMarcaOperacion);
    // --- RUBROS ---
    (_t = document.getElementById('btnNuevoRubroOp')) === null || _t === void 0 ? void 0 : _t.addEventListener('click', () => abrirModalRubroOp());
    (_u = document.getElementById('closeModalRubroOp')) === null || _u === void 0 ? void 0 : _u.addEventListener('click', () => {
        document.getElementById('modalFormRubroOp').style.display = 'none';
    });
    (_v = document.getElementById('inputBuscarRubroOp')) === null || _v === void 0 ? void 0 : _v.addEventListener('input', renderizarTablaRubrosOperacion);
    (_w = document.getElementById('filtroEstadoRubroOp')) === null || _w === void 0 ? void 0 : _w.addEventListener('change', renderizarTablaRubrosOperacion);
    (_x = document.getElementById('formRubroOp')) === null || _x === void 0 ? void 0 : _x.addEventListener('submit', guardarRubroOperacion);
}
// --- CLIENTES (RENDER + CRUD) ---
function renderizarTablaClientesOperacion() {
    var _a, _b, _c;
    const tbody = document.getElementById('tbodyClientesOp');
    if (!tbody)
        return;
    const q = (((_a = document.getElementById('inputBuscarClienteOp')) === null || _a === void 0 ? void 0 : _a.value) || '').toLowerCase().trim();
    const estado = ((_b = document.getElementById('filtroEstadoClienteOp')) === null || _b === void 0 ? void 0 : _b.value) || 'ACTIVOS';
    const orden = ((_c = document.getElementById('ordenClienteOp')) === null || _c === void 0 ? void 0 : _c.value) || 'RECIENTES';
    let lista = clientesLista.filter(c => {
        const esActivo = c.activo !== false;
        if (estado === 'ACTIVOS' && !esActivo)
            return false;
        if (estado === 'BAJA' && esActivo)
            return false;
        if (!q)
            return true;
        return (c.denominacion.toLowerCase().indexOf(q) !== -1 ||
            (c.cuitCuil && c.cuitCuil.toLowerCase().indexOf(q) !== -1) ||
            (c.email && c.email.toLowerCase().indexOf(q) !== -1) ||
            (c.domicilio && c.domicilio.toLowerCase().indexOf(q) !== -1));
    });
    if (orden === 'NOMBRE') {
        lista = [...lista].sort((a, b) => a.denominacion.localeCompare(b.denominacion));
    }
    else {
        lista = [...lista].sort((a, b) => b.id - a.id);
    }
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center muted-italic" style="padding: 28px;">No se encontraron clientes con los criterios aplicados.</td></tr>`;
        return;
    }
    lista.forEach(c => {
        const esActivo = c.activo !== false;
        const listaNombre = c.listaPrecioPredeterminadaId === 2 ? 'Precio mayorista' : 'Precio minorista';
        const condIva = c.condicionIva || (c.condicionIvaId === 1 ? 'IVA Responsable Inscripto' : 'Consumidor Final');
        const contactoParts = [c.telefono, c.celular ? `Cel: ${c.celular}` : '', c.email].filter(Boolean);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.id}</td>
            <td>
                <span class="date-cell-main">${c.tipoDocumento || 'CUIT'} ${c.cuitCuil || '—'}</span>
                <span class="date-cell-sub">${condIva} · Lista: ${listaNombre}</span>
            </td>
            <td>
                <strong>${c.denominacion}</strong>
                ${c.fechaAlta ? `<span class="date-cell-sub">Alta: ${formatearFechaHora(c.fechaAlta).fecha}</span>` : ''}
            </td>
            <td>${contactoParts.length ? contactoParts.join('<br>') : '<span class="muted-italic">Sin contacto</span>'}</td>
            <td>${c.domicilio || [c.calle, c.numero].filter(Boolean).join(' ') || '—'}</td>
            <td>${c.ultimaCompra ? formatearFechaHora(c.ultimaCompra).fecha : '—'}</td>
            <td class="text-right">
                <div class="row-actions">
                    <button type="button" class="btn-row" onclick="abrirModalClienteOp(${c.id})">✏️ Editar</button>
                    <button type="button" class="btn-row ${esActivo ? 'btn-row-delete' : 'btn-row-emitir'}" onclick="toggleEstadoClienteOp(${c.id})">
                        ${esActivo ? 'Dar de baja' : 'Activar'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
export const abrirModalClienteOp = (id) => {
    const modal = document.getElementById('modalFormClienteOp');
    const titulo = document.getElementById('tituloModalClienteOp');
    const form = document.getElementById('formClienteOp');
    form.reset();
    if (id) {
        const cli = clientesLista.find(c => c.id === id);
        if (!cli)
            return;
        titulo.textContent = 'Editar cliente';
        document.getElementById('editClienteOpId').value = String(cli.id);
        document.getElementById('cliTipoDoc').value = cli.tipoDocumento || 'CUIT';
        document.getElementById('cliCuit').value = cli.cuitCuil || '';
        document.getElementById('cliDenominacion').value = cli.denominacion || '';
        document.getElementById('cliCondicionIva').value = String(cli.condicionIvaId || 2);
        document.getElementById('cliListaPrecio').value = String(cli.listaPrecioPredeterminadaId || 1);
        document.getElementById('cliTelefono').value = cli.telefono || '';
        document.getElementById('cliCelular').value = cli.celular || '';
        document.getElementById('cliEmail').value = cli.email || '';
        document.getElementById('cliCalle').value = cli.calle || '';
        document.getElementById('cliNumero').value = cli.numero || '';
    }
    else {
        titulo.textContent = 'Nuevo cliente';
        document.getElementById('editClienteOpId').value = '';
    }
    modal.style.display = 'flex';
};
window.abrirModalClienteOp = abrirModalClienteOp;
function guardarClienteOperacion(e) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        e.preventDefault();
        const idStr = document.getElementById('editClienteOpId').value;
        const cuit = document.getElementById('cliCuit').value.trim();
        const soloDigitos = cuit.replace(/\D/g, '');
        if (soloDigitos.length !== 11 && soloDigitos.length !== 8) {
            mostrarToast('Documento inválido', 'En homologación ARCA el CUIT/CUIL debe contener 11 dígitos.', 'warning');
            return;
        }
        const condSelect = document.getElementById('cliCondicionIva');
        const listaSelect = document.getElementById('cliListaPrecio');
        const payload = {
            tipoDocumento: document.getElementById('cliTipoDoc').value,
            cuitCuil: cuit,
            denominacion: document.getElementById('cliDenominacion').value.trim(),
            condicionIvaId: parseInt(condSelect.value),
            condicionIva: ((_a = condSelect.options[condSelect.selectedIndex]) === null || _a === void 0 ? void 0 : _a.text) || 'Consumidor Final',
            listaPrecioPredeterminadaId: parseInt(listaSelect.value),
            listaPrecioNombre: ((_b = listaSelect.options[listaSelect.selectedIndex]) === null || _b === void 0 ? void 0 : _b.text) || 'Precio minorista',
            telefono: document.getElementById('cliTelefono').value.trim(),
            celular: document.getElementById('cliCelular').value.trim(),
            email: document.getElementById('cliEmail').value.trim(),
            calle: document.getElementById('cliCalle').value.trim(),
            numero: document.getElementById('cliNumero').value.trim()
        };
        const guardado = yield facturaService.guardarCliente(payload, idStr ? parseInt(idStr) : undefined);
        yield cargarClientes();
        renderizarTablaClientesOperacion();
        document.getElementById('modalFormClienteOp').style.display = 'none';
        mostrarToast(idStr ? 'Cliente Actualizado' : 'Cliente Creado', guardado.denominacion, 'success');
    });
}
export const toggleEstadoClienteOp = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const cli = clientesLista.find(c => c.id === id);
    if (!cli)
        return;
    const nuevoEstado = cli.activo === false;
    const ok = yield pedirConfirmacion(nuevoEstado ? 'Activar cliente' : 'Dar de baja cliente', nuevoEstado
        ? `¿Deseás reactivar a "${cli.denominacion}" para facturación?`
        : `El cliente "${cli.denominacion}" dejará de aparecer en el buscador de nuevas facturas.`, nuevoEstado ? 'Activar' : 'Dar de baja', !nuevoEstado);
    if (!ok)
        return;
    yield facturaService.cambiarEstadoCliente(cli, nuevoEstado);
    yield cargarClientes();
    renderizarTablaClientesOperacion();
    mostrarToast(nuevoEstado ? 'Cliente activado' : 'Cliente dado de baja', cli.denominacion);
});
window.toggleEstadoClienteOp = toggleEstadoClienteOp;
// --- ARTÍCULOS (RENDER + ALTA CON LISTAS) ---
function renderizarTablaArticulosOperacion() {
    var _a, _b, _c;
    const tbody = document.getElementById('tbodyArticulosOp');
    if (!tbody)
        return;
    const q = (((_a = document.getElementById('inputBuscarArticuloOp')) === null || _a === void 0 ? void 0 : _a.value) || '').toLowerCase().trim();
    const estado = ((_b = document.getElementById('filtroEstadoArticuloOp')) === null || _b === void 0 ? void 0 : _b.value) || 'ACTIVOS';
    const listaId = ((_c = document.getElementById('filtroListaArticuloOp')) === null || _c === void 0 ? void 0 : _c.value) || 'TODAS';
    const filtrados = catalogoCompleto.filter(a => {
        const esActivo = a.activo !== false;
        if (estado === 'ACTIVOS' && !esActivo)
            return false;
        if (estado === 'BAJA' && esActivo)
            return false;
        if (listaId !== 'TODAS' && String(a.listaPrecioId) !== listaId)
            return false;
        if (!q)
            return true;
        return (a.articuloNombre.toLowerCase().indexOf(q) !== -1 ||
            (a.articuloCodigo && a.articuloCodigo.toLowerCase().indexOf(q) !== -1) ||
            (a.rubroNombre && a.rubroNombre.toLowerCase().indexOf(q) !== -1) ||
            (a.marcaNombre && a.marcaNombre.toLowerCase().indexOf(q) !== -1));
    });
    tbody.innerHTML = '';
    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center muted-italic" style="padding: 28px;">No hay artículos para mostrar con los filtros seleccionados.</td></tr>`;
        return;
    }
    filtrados.forEach(a => {
        const esActivo = a.activo !== false;
        const esMayorista = a.listaPrecioId === 2 || a.listaNombre.toLowerCase().indexOf('mayorista') !== -1;
        const badgeLista = esMayorista
            ? `<span class="badge-lista badge-mayorista">Mayorista</span>`
            : `<span class="badge-lista badge-minorista">Minorista</span>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.articuloId}</td>
            <td><span class="item-code">${a.articuloCodigo || 'ART-' + completarCeros(a.articuloId, 6)}</span></td>
            <td><strong>${a.articuloNombre}</strong></td>
            <td>${a.rubroNombre || 'General'}</td>
            <td>${a.marcaNombre || 'Genérica'}</td>
            <td>${badgeLista}</td>
            <td class="text-right"><strong>${formatearPesos(a.precioVenta)}</strong></td>
            <td class="text-right">
                <div class="row-actions">
                    <button type="button" class="btn-row ${esActivo ? 'btn-row-delete' : 'btn-row-emitir'}" onclick="toggleEstadoArticuloOp(${a.id})">
                        ${esActivo ? 'Dar de baja' : 'Activar'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
function abrirModalArticuloOp() {
    const form = document.getElementById('formArticuloOp');
    form.reset();
    const selRubro = document.getElementById('artRubroSelect');
    selRubro.innerHTML = rubrosLista
        .filter(r => r.activo !== false)
        .map(r => `<option value="${r.id}">${r.codigo} - ${r.denominacion}</option>`)
        .join('');
    const selMarca = document.getElementById('artMarcaSelect');
    selMarca.innerHTML = marcasLista
        .filter(m => m.activo !== false)
        .map(m => `<option value="${m.id}">${m.codigo} - ${m.denominacion}</option>`)
        .join('');
    const chkMin = document.getElementById('chkListaMinorista');
    const inpMin = document.getElementById('inputPrecioMinorista');
    chkMin.checked = true;
    inpMin.disabled = false;
    const chkMay = document.getElementById('chkListaMayorista');
    const inpMay = document.getElementById('inputPrecioMayorista');
    chkMay.checked = false;
    inpMay.disabled = true;
    document.getElementById('modalFormArticuloOp').style.display = 'flex';
}
function guardarArticuloOperacion(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const denominacion = document.getElementById('artDenominacion').value.trim();
        const chkMin = document.getElementById('chkListaMinorista').checked;
        const chkMay = document.getElementById('chkListaMayorista').checked;
        if (!chkMin && !chkMay) {
            mostrarToast('Selecciona Al Menos Una Lista De Precios', 'Activá Lista minorista, Lista mayorista o ambas.', 'warning');
            return;
        }
        const precioMin = chkMin ? parseFloat(document.getElementById('inputPrecioMinorista').value) : null;
        const precioMay = chkMay ? parseFloat(document.getElementById('inputPrecioMayorista').value) : null;
        if (chkMin && (!precioMin || isNaN(precioMin) || precioMin <= 0)) {
            mostrarToast('Precio minorista inválido', 'Ingresá un importe mayor a 0 para la lista minorista.', 'warning');
            return;
        }
        if (chkMay && (!precioMay || isNaN(precioMay) || precioMay <= 0)) {
            mostrarToast('Precio mayorista inválido', 'Ingresá un importe mayor a 0 para la lista mayorista.', 'warning');
            return;
        }
        const selRubro = document.getElementById('artRubroSelect');
        const selMarca = document.getElementById('artMarcaSelect');
        const rubroObj = rubrosLista.find(r => r.id === parseInt(selRubro.value));
        const marcaObj = marcasLista.find(m => m.id === parseInt(selMarca.value));
        yield facturaService.crearArticulo({
            denominacion,
            rubroId: (rubroObj === null || rubroObj === void 0 ? void 0 : rubroObj.id) || 1,
            rubroNombre: (rubroObj === null || rubroObj === void 0 ? void 0 : rubroObj.denominacion) || 'General',
            marcaId: (marcaObj === null || marcaObj === void 0 ? void 0 : marcaObj.id) || 1,
            marcaNombre: (marcaObj === null || marcaObj === void 0 ? void 0 : marcaObj.denominacion) || 'Genérica',
            precioMinorista: precioMin,
            precioMayorista: precioMay
        });
        yield cargarCatalogo();
        renderizarTablaArticulosOperacion();
        document.getElementById('modalFormArticuloOp').style.display = 'none';
        mostrarToast('Artículo Creado', `${denominacion} ya está disponible para facturar.`, 'success');
    });
}
export const toggleEstadoArticuloOp = (lpaId) => __awaiter(void 0, void 0, void 0, function* () {
    const item = catalogoCompleto.find(a => a.id === lpaId);
    if (!item)
        return;
    const nuevoEstado = item.activo === false;
    yield facturaService.cambiarEstadoArticulo(item, nuevoEstado);
    yield cargarCatalogo();
    renderizarTablaArticulosOperacion();
    mostrarToast(nuevoEstado ? 'Artículo activado' : 'Artículo dado de baja', `${item.articuloNombre} (${item.listaNombre})`);
});
window.toggleEstadoArticuloOp = toggleEstadoArticuloOp;
// --- MARCAS ---
function renderizarTablaMarcasOperacion() {
    var _a, _b;
    const tbody = document.getElementById('tbodyMarcasOp');
    if (!tbody)
        return;
    const q = (((_a = document.getElementById('inputBuscarMarcaOp')) === null || _a === void 0 ? void 0 : _a.value) || '').toLowerCase().trim();
    const estado = ((_b = document.getElementById('filtroEstadoMarcaOp')) === null || _b === void 0 ? void 0 : _b.value) || 'ACTIVOS';
    const filtradas = marcasLista.filter(m => {
        if (estado === 'ACTIVOS' && !m.activo)
            return false;
        if (estado === 'BAJA' && m.activo)
            return false;
        if (!q)
            return true;
        return m.denominacion.toLowerCase().indexOf(q) !== -1 || m.codigo.toLowerCase().indexOf(q) !== -1;
    });
    tbody.innerHTML = '';
    if (filtradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center muted-italic" style="padding: 28px;">No se encontraron marcas.</td></tr>`;
        return;
    }
    filtradas.forEach(m => {
        const badge = m.activo
            ? `<span class="status-pill status-emitida">Activa</span>`
            : `<span class="status-pill status-eliminada">Baja</span>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${m.id}</td>
            <td><span class="item-code">${m.codigo}</span></td>
            <td><strong>${m.denominacion}</strong></td>
            <td>${formatearFechaHora(m.fechaAlta).fecha}</td>
            <td>${badge}</td>
            <td class="text-right">
                <div class="row-actions">
                    <button type="button" class="btn-row" onclick="abrirModalMarcaOp(${m.id})">✏️ Editar</button>
                    <button type="button" class="btn-row ${m.activo ? 'btn-row-delete' : 'btn-row-emitir'}" onclick="toggleEstadoMarcaOp(${m.id})">
                        ${m.activo ? 'Dar de baja' : 'Activar'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
export const abrirModalMarcaOp = (id) => {
    const modal = document.getElementById('modalFormMarcaOp');
    const titulo = document.getElementById('tituloModalMarcaOp');
    const inputId = document.getElementById('editMarcaOpId');
    const inputDenom = document.getElementById('marcaDenominacion');
    if (id) {
        const m = marcasLista.find(x => x.id === id);
        if (!m)
            return;
        titulo.textContent = 'Editar marca';
        inputId.value = String(m.id);
        inputDenom.value = m.denominacion;
    }
    else {
        titulo.textContent = 'Nueva marca';
        inputId.value = '';
        inputDenom.value = '';
    }
    modal.style.display = 'flex';
    inputDenom.focus();
};
window.abrirModalMarcaOp = abrirModalMarcaOp;
function guardarMarcaOperacion(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const idStr = document.getElementById('editMarcaOpId').value;
        const denom = document.getElementById('marcaDenominacion').value.trim();
        if (!denom)
            return;
        yield facturaService.guardarMarca(denom, idStr ? parseInt(idStr) : undefined);
        yield cargarMarcas();
        renderizarTablaMarcasOperacion();
        document.getElementById('modalFormMarcaOp').style.display = 'none';
        mostrarToast(idStr ? 'Marca Actualizada' : 'Marca Creada', denom, 'success');
    });
}
export const toggleEstadoMarcaOp = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const m = marcasLista.find(x => x.id === id);
    if (!m)
        return;
    yield facturaService.cambiarEstadoMarca(id, !m.activo);
    yield cargarMarcas();
    renderizarTablaMarcasOperacion();
    mostrarToast(!m.activo ? 'Marca activada' : 'Marca dada de baja', m.denominacion);
});
window.toggleEstadoMarcaOp = toggleEstadoMarcaOp;
// --- RUBROS ---
function renderizarTablaRubrosOperacion() {
    var _a, _b;
    const tbody = document.getElementById('tbodyRubrosOp');
    if (!tbody)
        return;
    const q = (((_a = document.getElementById('inputBuscarRubroOp')) === null || _a === void 0 ? void 0 : _a.value) || '').toLowerCase().trim();
    const estado = ((_b = document.getElementById('filtroEstadoRubroOp')) === null || _b === void 0 ? void 0 : _b.value) || 'ACTIVOS';
    const filtrados = rubrosLista.filter(r => {
        if (estado === 'ACTIVOS' && !r.activo)
            return false;
        if (estado === 'BAJA' && r.activo)
            return false;
        if (!q)
            return true;
        return r.denominacion.toLowerCase().indexOf(q) !== -1 || r.codigo.toLowerCase().indexOf(q) !== -1;
    });
    tbody.innerHTML = '';
    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center muted-italic" style="padding: 28px;">No se encontraron rubros.</td></tr>`;
        return;
    }
    filtrados.forEach(r => {
        const badge = r.activo
            ? `<span class="status-pill status-emitida">Activo</span>`
            : `<span class="status-pill status-eliminada">Baja</span>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.id}</td>
            <td><span class="item-code">${r.codigo}</span></td>
            <td><strong>${r.denominacion}</strong></td>
            <td>${formatearFechaHora(r.fechaAlta).fecha}</td>
            <td>${badge}</td>
            <td class="text-right">
                <div class="row-actions">
                    <button type="button" class="btn-row" onclick="abrirModalRubroOp(${r.id})">✏️ Editar</button>
                    <button type="button" class="btn-row ${r.activo ? 'btn-row-delete' : 'btn-row-emitir'}" onclick="toggleEstadoRubroOp(${r.id})">
                        ${r.activo ? 'Dar de baja' : 'Activar'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
export const abrirModalRubroOp = (id) => {
    const modal = document.getElementById('modalFormRubroOp');
    const titulo = document.getElementById('tituloModalRubroOp');
    const inputId = document.getElementById('editRubroOpId');
    const inputDenom = document.getElementById('rubroDenominacion');
    if (id) {
        const r = rubrosLista.find(x => x.id === id);
        if (!r)
            return;
        titulo.textContent = 'Editar rubro';
        inputId.value = String(r.id);
        inputDenom.value = r.denominacion;
    }
    else {
        titulo.textContent = 'Nuevo rubro';
        inputId.value = '';
        inputDenom.value = '';
    }
    modal.style.display = 'flex';
    inputDenom.focus();
};
window.abrirModalRubroOp = abrirModalRubroOp;
function guardarRubroOperacion(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const idStr = document.getElementById('editRubroOpId').value;
        const denom = document.getElementById('rubroDenominacion').value.trim();
        if (!denom)
            return;
        yield facturaService.guardarRubro(denom, idStr ? parseInt(idStr) : undefined);
        yield cargarRubros();
        renderizarTablaRubrosOperacion();
        document.getElementById('modalFormRubroOp').style.display = 'none';
        mostrarToast(idStr ? 'Rubro Actualizado' : 'Rubro Creado', denom, 'success');
    });
}
export const toggleEstadoRubroOp = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const r = rubrosLista.find(x => x.id === id);
    if (!r)
        return;
    yield facturaService.cambiarEstadoRubro(id, !r.activo);
    yield cargarRubros();
    renderizarTablaRubrosOperacion();
    mostrarToast(!r.activo ? 'Rubro activado' : 'Rubro dado de baja', r.denominacion);
});
window.toggleEstadoRubroOp = toggleEstadoRubroOp;
