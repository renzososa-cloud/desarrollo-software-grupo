import { FacturaService, FiltrosBusqueda } from './FacturaService.js';
import {
    FacturaDetalleRequestDTO,
    FacturaRequestDTO,
    FacturaReporteDTO,
    ArticuloCatalogoDTO,
    ListaPrecioDTO,
    ClienteDTO,
    MarcaDTO,
    RubroDTO,
    TabEstadoFactura,
    SeccionActiva
} from './models/factura.dto.js';

const facturaService = new FacturaService();

interface DetalleUI extends FacturaDetalleRequestDTO {
    articuloId: number;
    articuloCodigo: string;
    articuloNombre: string;
    precioUnitarioUI: number;
    descuentoMontoUI: number;
    subtotalUI: number;
}

// Estado global de navegación y datos
let seccionActual: SeccionActiva = 'SIN_EMITIR';
let tabFacturacionActual: TabEstadoFactura = 'SIN_EMITIR';
let paginaActual: number = 0;
let tamanioPagina: number = 10;
let totalPaginas: number = 1;
let totalElementos: number = 0;
let filtrosActuales: FiltrosBusqueda = {};

let listasPrecios: ListaPrecioDTO[] = [];
let catalogoCompleto: ArticuloCatalogoDTO[] = [];
let clientesLista: ClienteDTO[] = [];
let marcasLista: MarcaDTO[] = [];
let rubrosLista: RubroDTO[] = [];
let detallesFactura: DetalleUI[] = [];

const formatoMoneda = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatearPesos(valor: number): string {
    return `$ ${formatoMoneda.format(valor || 0)}`;
}

function completarCeros(valor: number | string, longitud: number): string {
    let texto = String(valor);
    while (texto.length < longitud) {
        texto = '0' + texto;
    }
    return texto;
}

function formatearFechaHora(fechaIso: string | null | undefined): { fecha: string; hora: string } {
    if (!fechaIso) return { fecha: '—', hora: '' };
    const texto = String(fechaIso);
    const soloFecha = texto.substring(0, 10);
    const partes = soloFecha.split('-');
    const fecha = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : soloFecha;
    const hora = texto.length >= 16 ? texto.substring(11, 16) : '';
    return { fecha, hora };
}

// =========================================================
// SISTEMA DE NOTIFICACIONES TOAST Y CONFIRMACIÓN PROPIA
// =========================================================
type TipoToast = 'success' | 'warning' | 'error';

function mostrarToast(titulo: string, subtitulo: string = '', tipo: TipoToast = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

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

    toast.querySelector('.toast-close')?.addEventListener('click', cerrar);
    container.appendChild(toast);
    setTimeout(cerrar, 3800);
}

function pedirConfirmacion(
    titulo: string,
    mensaje: string,
    textoBoton: string = 'Confirmar',
    esPeligroso: boolean = false
): Promise<boolean> {
    return new Promise((resolve) => {
        const modal = document.getElementById('modalConfirmacion') as HTMLElement;
        const elTitulo = document.getElementById('confirmTitulo') as HTMLElement;
        const elMensaje = document.getElementById('confirmMensaje') as HTMLElement;
        const btnAceptar = document.getElementById('btnAceptarConfirm') as HTMLButtonElement;
        const btnCancelar = document.getElementById('btnCancelarConfirm') as HTMLButtonElement;
        const btnClose = document.getElementById('closeModalConfirmacion') as HTMLButtonElement;

        elTitulo.textContent = titulo;
        elMensaje.textContent = mensaje;
        btnAceptar.textContent = textoBoton;
        btnAceptar.className = esPeligroso ? 'btn-danger' : 'btn-primary';

        const finalizar = (resultado: boolean) => {
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
document.addEventListener('DOMContentLoaded', async () => {
    inicializarTema();
    inicializarNavegacionLateral();
    inicializarEventosFacturacion();
    inicializarEventosOperacion();

    await Promise.all([
        cargarListasPrecios(),
        cargarCatalogo(),
        cargarClientes(),
        cargarMarcas(),
        cargarRubros()
    ]);

    await cargarFacturas();
});

function inicializarTema() {
    const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        if (themeToggle) themeToggle.textContent = '🌙';
    } else {
        document.body.classList.add('dark-theme');
        if (themeToggle) themeToggle.textContent = '☀️';
    }

    themeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const esOscuro = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', esOscuro ? 'dark' : 'light');
        themeToggle.textContent = esOscuro ? '☀️' : '🌙';
    });
}

function cambiarVistaActiva(nuevaSeccion: SeccionActiva) {
    seccionActual = nuevaSeccion;

    document.querySelectorAll('#sidebarNav .nav-item').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-section') === nuevaSeccion);
    });

    const vistaFact = document.getElementById('vistaFacturacion') as HTMLElement;
    const vistaCli = document.getElementById('vistaClientes') as HTMLElement;
    const vistaArt = document.getElementById('vistaArticulos') as HTMLElement;
    const vistaMar = document.getElementById('vistaMarcas') as HTMLElement;
    const vistaRub = document.getElementById('vistaRubros') as HTMLElement;

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
    } else if (nuevaSeccion === 'CLIENTES') {
        vistaCli.style.display = 'block';
        renderizarTablaClientesOperacion();
    } else if (nuevaSeccion === 'ARTICULOS') {
        vistaArt.style.display = 'block';
        renderizarTablaArticulosOperacion();
    } else if (nuevaSeccion === 'MARCAS') {
        vistaMar.style.display = 'block';
        renderizarTablaMarcasOperacion();
    } else if (nuevaSeccion === 'RUBROS') {
        vistaRub.style.display = 'block';
        renderizarTablaRubrosOperacion();
    }
}

function inicializarNavegacionLateral() {
    document.querySelectorAll('#sidebarNav .nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLButtonElement;
            const sec = (target.getAttribute('data-section') as SeccionActiva) || 'SIN_EMITIR';
            cambiarVistaActiva(sec);
        });
    });

    document.getElementById('btnPrevPage')?.addEventListener('click', async () => {
        if (paginaActual > 0) {
            paginaActual--;
            await cargarFacturas();
        }
    });

    document.getElementById('btnNextPage')?.addEventListener('click', async () => {
        if (paginaActual < totalPaginas - 1) {
            paginaActual++;
            await cargarFacturas();
        }
    });

    document.getElementById('selectPageSize')?.addEventListener('change', async (e) => {
        tamanioPagina = parseInt((e.target as HTMLSelectElement).value) || 10;
        paginaActual = 0;
        await cargarFacturas();
    });

    document.getElementById('btnRecargar')?.addEventListener('click', async () => {
        await cargarFacturas();
        mostrarToast('Listado actualizado', 'Se sincronizaron los comprobantes con el servidor.');
    });

    document.getElementById('btnExportarPdf')?.addEventListener('click', () => {
        window.open(facturaService.construirUrlExportacion('pdf', tabFacturacionActual, filtrosActuales), '_blank');
    });

    document.getElementById('btnExportarExcel')?.addEventListener('click', () => {
        window.open(facturaService.construirUrlExportacion('excel', tabFacturacionActual, filtrosActuales), '_blank');
    });
}

function actualizarEncabezadoFacturacion() {
    const titulo = document.getElementById('tituloSeccion');
    const subtitulo = document.getElementById('subtituloSeccion');
    const thFecha = document.getElementById('thColumnaFecha');

    if (tabFacturacionActual === 'SIN_EMITIR') {
        if (titulo) titulo.textContent = 'Sin emitir';
        if (subtitulo) subtitulo.textContent = 'Revisá tus facturas y validalas con ARCA cuando estén listas.';
        if (thFecha) thFecha.textContent = 'Creación interna';
    } else if (tabFacturacionActual === 'EMITIDA') {
        if (titulo) titulo.textContent = 'Emitidas';
        if (subtitulo) subtitulo.textContent = 'Comprobantes autorizados por ARCA con CAE asignado.';
        if (thFecha) thFecha.textContent = 'Emisión';
    } else {
        if (titulo) titulo.textContent = 'Eliminadas';
        if (subtitulo) subtitulo.textContent = 'Borradores dados de baja (los comprobantes emitidos nunca se eliminan).';
        if (thFecha) thFecha.textContent = 'Creación interna';
    }
}

// =========================================================
// EVENTOS DE MODALES DE FACTURACIÓN
// =========================================================
function inicializarEventosFacturacion() {
    const modalFacturaForm = document.getElementById('modalFacturaForm') as HTMLElement;
    const modalArticulo = document.getElementById('modalArticulo') as HTMLElement;
    const modalCliente = document.getElementById('modalCliente') as HTMLElement;
    const modalFiltros = document.getElementById('modalFiltros') as HTMLElement;
    const modalDetalle = document.getElementById('modalDetalleFactura') as HTMLElement;

    document.getElementById('btnNuevaFacturaSidebar')?.addEventListener('click', () => abrirModalNuevaFactura());
    document.getElementById('btnNuevaFacturaHeader')?.addEventListener('click', () => abrirModalNuevaFactura());

    document.getElementById('closeModalFacturaForm')?.addEventListener('click', () => {
        modalFacturaForm.style.display = 'none';
    });

    // Recalcular ítems si cambia la lista de precios de cabecera
    document.getElementById('listaPrecioId')?.addEventListener('change', (e) => {
        const nuevaListaId = parseInt((e.target as HTMLSelectElement).value);
        if (detallesFactura.length > 0) {
            const actualizados: DetalleUI[] = [];
            for (const item of detallesFactura) {
                const equivalente = catalogoCompleto.find(
                    c => c.listaPrecioId === nuevaListaId && c.articuloId === item.articuloId && c.activo !== false
                );
                if (equivalente) {
                    const calc = calcularRenglon(equivalente.precioVenta, item.cantidad, item.porcentajeBonificacion);
                    actualizados.push({
                        ...item,
                        listaPrecioArticuloId: equivalente.id,
                        precioUnitarioUI: equivalente.precioVenta,
                        descuentoMontoUI: calc.descuento,
                        subtotalUI: calc.subtotal
                    });
                }
            }
            if (actualizados.length < detallesFactura.length) {
                mostrarToast(
                    'Lista de precios actualizada',
                    'Algunos artículos no tenían precio en la nueva lista y fueron omitidos.',
                    'warning'
                );
            }
            detallesFactura = actualizados;
            actualizarTablaDetalles();
        }
    });

    // Explorer de Artículos
    document.getElementById('btnAbrirModalArticulo')?.addEventListener('click', () => {
        const inputSearch = document.getElementById('searchArticuloModal') as HTMLInputElement;
        if (inputSearch) inputSearch.value = '';
        filtrarYRenderizarCatalogo();
        modalArticulo.style.display = 'flex';
        inputSearch?.focus();
    });

    document.getElementById('closeModalArticulo')?.addEventListener('click', () => {
        modalArticulo.style.display = 'none';
    });

    document.getElementById('searchArticuloModal')?.addEventListener('input', () => {
        filtrarYRenderizarCatalogo();
    });

    // Explorer de Clientes
    document.getElementById('btnAbrirModalCliente')?.addEventListener('click', () => {
        const inputSearch = document.getElementById('searchClienteModal') as HTMLInputElement;
        if (inputSearch) inputSearch.value = '';
        renderizarTablaClientesExplorer(clientesLista.filter(c => c.activo !== false));
        modalCliente.style.display = 'flex';
        inputSearch?.focus();
    });

    document.getElementById('closeModalCliente')?.addEventListener('click', () => {
        modalCliente.style.display = 'none';
    });

    document.getElementById('btnElegirConsumidorFinal')?.addEventListener('click', () => {
        (document.getElementById('clienteId') as HTMLInputElement).value = '';
        (document.getElementById('clienteNombre') as HTMLInputElement).value = 'Consumidor Final';
        (document.getElementById('condicionIvaId') as HTMLSelectElement).value = '2';
        modalCliente.style.display = 'none';
    });

    document.getElementById('searchClienteModal')?.addEventListener('input', (e) => {
        const term = (e.target as HTMLInputElement).value.toLowerCase().trim();
        const filtrados = clientesLista.filter(c =>
                c.activo !== false && (
                    c.denominacion.toLowerCase().includes(term) ||
                    (c.cuitCuil && c.cuitCuil.toLowerCase().includes(term))
                )
        );
        renderizarTablaClientesExplorer(filtrados);
    });

    // Filtros
    document.getElementById('btnAbrirFiltros')?.addEventListener('click', () => {
        (document.getElementById('filtroCliente') as HTMLInputElement).value = filtrosActuales.cliente || '';
        (document.getElementById('filtroNumero') as HTMLInputElement).value = filtrosActuales.numero || '';
        (document.getElementById('filtroFechaDesde') as HTMLInputElement).value = filtrosActuales.fechaDesde || '';
        (document.getElementById('filtroFechaHasta') as HTMLInputElement).value = filtrosActuales.fechaHasta || '';
        (document.getElementById('filtroMontoMinimo') as HTMLInputElement).value = filtrosActuales.montoMinimo || '';
        modalFiltros.style.display = 'flex';
    });

    document.getElementById('closeModalFiltros')?.addEventListener('click', () => {
        modalFiltros.style.display = 'none';
    });

    document.getElementById('btnLimpiarModalFiltros')?.addEventListener('click', async () => {
        (document.getElementById('formFiltros') as HTMLFormElement).reset();
        filtrosActuales = {};
        actualizarChipsFiltros();
        modalFiltros.style.display = 'none';
        paginaActual = 0;
        await cargarFacturas();
    });

    document.getElementById('btnLimpiarFiltrosRapido')?.addEventListener('click', async () => {
        filtrosActuales = {};
        actualizarChipsFiltros();
        paginaActual = 0;
        await cargarFacturas();
    });

    document.getElementById('formFiltros')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cliente = (document.getElementById('filtroCliente') as HTMLInputElement).value.trim();
        const numero = (document.getElementById('filtroNumero') as HTMLInputElement).value.trim();
        const fechaDesde = (document.getElementById('filtroFechaDesde') as HTMLInputElement).value;
        const fechaHasta = (document.getElementById('filtroFechaHasta') as HTMLInputElement).value;
        const montoMinimo = (document.getElementById('filtroMontoMinimo') as HTMLInputElement).value.trim();

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
        await cargarFacturas();
    });

    document.getElementById('closeModalDetalleFactura')?.addEventListener('click', () => {
        modalDetalle.style.display = 'none';
    });

    document.getElementById('facturaForm')?.addEventListener('submit', guardarFactura);
}

// =========================================================
// CARGA DE CATÁLOGOS
// =========================================================
async function cargarListasPrecios() {
    listasPrecios = await facturaService.obtenerListasPrecios();
    const select = document.getElementById('listaPrecioId') as HTMLSelectElement;
    if (!select) return;
    select.innerHTML = '';
    listasPrecios.forEach(lp => {
        const opt = document.createElement('option');
        opt.value = lp.id.toString();
        opt.textContent = `${lp.denominacion} (${lp.codigo})`;
        select.appendChild(opt);
    });
}

async function cargarCatalogo() {
    catalogoCompleto = await facturaService.obtenerCatalogo();
}

async function cargarClientes() {
    clientesLista = await facturaService.obtenerClientes();
}

async function cargarMarcas() {
    marcasLista = await facturaService.obtenerMarcas();
}

async function cargarRubros() {
    rubrosLista = await facturaService.obtenerRubros();
}

function renderizarTablaClientesExplorer(lista: ClienteDTO[]) {
    const tbody = document.getElementById('tbodyClientesModal');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center muted-italic">No se encontraron clientes activos.</td></tr>`;
        return;
    }

    lista.forEach(cli => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cli.id}</td>
            <td>${cli.cuitCuil || '—'}</td>
            <td><strong>${cli.denominacion}</strong></td>
            <td class="text-center">
                <button type="button" class="btn-primary">Elegir</button>
            </td>
        `;
        tr.querySelector('button')?.addEventListener('click', () => {
            (document.getElementById('clienteId') as HTMLInputElement).value = cli.id.toString();
            (document.getElementById('clienteNombre') as HTMLInputElement).value = cli.cuitCuil
                ? `${cli.denominacion} (${cli.cuitCuil})`
                : cli.denominacion;

            if (cli.condicionIvaId) {
                (document.getElementById('condicionIvaId') as HTMLSelectElement).value = cli.condicionIvaId.toString();
            }
            if (cli.listaPrecioPredeterminadaId) {
                const selectLista = document.getElementById('listaPrecioId') as HTMLSelectElement;
                selectLista.value = cli.listaPrecioPredeterminadaId.toString();
                selectLista.dispatchEvent(new Event('change'));
            }

            const modalCliente = document.getElementById('modalCliente');
            if (modalCliente) modalCliente.style.display = 'none';
        });
        tbody.appendChild(tr);
    });
}

function filtrarYRenderizarCatalogo() {
    const tbody = document.getElementById('tbodyArticulosModal');
    const contador = document.getElementById('contadorArticulosModal');
    const badgeLista = document.getElementById('badgeListaActivaExplorer');
    const inputSearch = document.getElementById('searchArticuloModal') as HTMLInputElement;
    const selectLista = document.getElementById('listaPrecioId') as HTMLSelectElement;

    const listaSeleccionadaId = parseInt(selectLista?.value || '1');
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
        const coincideTexto =
            art.articuloNombre.toLowerCase().indexOf(termino) !== -1 ||
            (art.articuloCodigo && art.articuloCodigo.toLowerCase().indexOf(termino) !== -1);
        return coincideLista && coincideTexto;
    });

    if (!tbody) return;
    tbody.innerHTML = '';

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center muted-italic">No hay artículos disponibles para esta lista de precios.</td></tr>`;
    } else {
        filtrados.forEach(art => {
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
                } else {
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
                if (modalArticulo) modalArticulo.style.display = 'none';
            };

            tr.querySelector('button')?.addEventListener('click', agregarEsteArticulo);
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
function calcularRenglon(precioUnitario: number, cantidad: number, porcentajeBonif: number) {
    const bruto = precioUnitario * cantidad;
    const descuento = Math.round(bruto * (porcentajeBonif / 100) * 100) / 100;
    const subtotal = Math.round((bruto - descuento) * 100) / 100;
    return { descuento, subtotal };
}

function actualizarTablaDetalles() {
    const tbody = document.getElementById('tbodyDetalles');
    const spanTotal = document.getElementById('importeTotal');
    let totalGeneral = 0;

    if (!tbody) return;
    tbody.innerHTML = '';

    if (detallesFactura.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center muted-italic" style="padding: 24px;">No hay artículos cargados. Haga clic en "+ Agregar artículo".</td></tr>`;
    } else {
        detallesFactura.forEach((det, index) => {
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

            const inputCant = tr.querySelector('.input-cant-item') as HTMLInputElement;
            inputCant?.addEventListener('change', () => {
                let nuevaCant = parseFloat(inputCant.value);
                if (isNaN(nuevaCant) || nuevaCant <= 0) nuevaCant = 1;
                det.cantidad = nuevaCant;
                const calc = calcularRenglon(det.precioUnitarioUI, det.cantidad, det.porcentajeBonificacion);
                det.descuentoMontoUI = calc.descuento;
                det.subtotalUI = calc.subtotal;
                actualizarTablaDetalles();
            });

            const inputBonif = tr.querySelector('.input-bonif-item') as HTMLInputElement;
            inputBonif?.addEventListener('change', () => {
                let nuevaBonif = parseFloat(inputBonif.value);
                if (isNaN(nuevaBonif) || nuevaBonif < 0) nuevaBonif = 0;
                if (nuevaBonif > 100) nuevaBonif = 100;
                det.porcentajeBonificacion = nuevaBonif;
                const calc = calcularRenglon(det.precioUnitarioUI, det.cantidad, det.porcentajeBonificacion);
                det.descuentoMontoUI = calc.descuento;
                det.subtotalUI = calc.subtotal;
                actualizarTablaDetalles();
            });

            tr.querySelector('.btn-trash-circle')?.addEventListener('click', () => {
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
    (document.getElementById('editFacturaId') as HTMLInputElement).value = '';
    (document.getElementById('tituloModalFactura') as HTMLElement).textContent = 'Nueva factura';
    (document.getElementById('metaNumeroFactura') as HTMLElement).textContent = 'Se asigna al emitir';
    (document.getElementById('metaFechaFactura') as HTMLElement).textContent = 'Se asigna al emitir';
    (document.getElementById('btnGuardarFactura') as HTMLButtonElement).textContent = '✓ Guardar sin emitir';

    (document.getElementById('puntoVentaId') as HTMLSelectElement).value = '1';
    (document.getElementById('clienteId') as HTMLInputElement).value = '';
    (document.getElementById('clienteNombre') as HTMLInputElement).value = 'Consumidor Final';
    (document.getElementById('condicionIvaId') as HTMLSelectElement).value = '2';
    (document.getElementById('tipoMonedaId') as HTMLSelectElement).value = '1';
    (document.getElementById('observaciones') as HTMLInputElement).value = '';

    if (listasPrecios.length > 0) {
        (document.getElementById('listaPrecioId') as HTMLSelectElement).value = listasPrecios[0].id.toString();
    }

    detallesFactura = [];
    actualizarTablaDetalles();

    const modal = document.getElementById('modalFacturaForm') as HTMLElement;
    modal.style.display = 'flex';
}

export const abrirModalEditarFactura = async (id: number) => {
    const factura = await facturaService.obtenerFacturaPorId(id);
    if (!factura) {
        mostrarToast('Error al cargar', 'No se pudo obtener la factura para editar.', 'error');
        return;
    }

    if (factura.estado === 'EMITIDA' || factura.cae) {
        mostrarToast('Operación no permitida', 'Los comprobantes emitidos con CAE no pueden editarse.', 'error');
        return;
    }

    (document.getElementById('editFacturaId') as HTMLInputElement).value = factura.id.toString();
    (document.getElementById('tituloModalFactura') as HTMLElement).textContent = `Editar factura #${factura.id}`;
    (document.getElementById('metaNumeroFactura') as HTMLElement).textContent = factura.numero ? String(factura.numero) : 'Se asigna al emitir';

    const fCreacion = formatearFechaHora(factura.fechaCreacionInterna);
    (document.getElementById('metaFechaFactura') as HTMLElement).textContent = `${fCreacion.fecha} ${fCreacion.hora}`.trim();
    (document.getElementById('btnGuardarFactura') as HTMLButtonElement).textContent = '✓ Guardar cambios';

    (document.getElementById('puntoVentaId') as HTMLSelectElement).value = String(factura.puntoVentaId || 1);
    (document.getElementById('clienteId') as HTMLInputElement).value = factura.clienteId ? String(factura.clienteId) : '';
    (document.getElementById('clienteNombre') as HTMLInputElement).value = factura.clienteDenominacion || 'Consumidor Final';
    (document.getElementById('condicionIvaId') as HTMLSelectElement).value = String(factura.condicionIvaId || 2);
    (document.getElementById('tipoMonedaId') as HTMLSelectElement).value = String(factura.tipoMonedaId || 1);
    (document.getElementById('observaciones') as HTMLInputElement).value = factura.observaciones || '';

    const listaId = factura.listaPrecioId || (factura.detalles[0]?.listaPrecioId) || 1;
    (document.getElementById('listaPrecioId') as HTMLSelectElement).value = String(listaId);

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
    if (modalDetalle) modalDetalle.style.display = 'none';

    const modalForm = document.getElementById('modalFacturaForm') as HTMLElement;
    modalForm.style.display = 'flex';
};
(window as any).abrirModalEditarFactura = abrirModalEditarFactura;

async function guardarFactura(e: Event) {
    e.preventDefault();

    if (detallesFactura.length === 0) {
        mostrarToast('Comprobante incompleto', 'Agregá al menos un artículo antes de guardar.', 'warning');
        return;
    }

    const editIdStr = (document.getElementById('editFacturaId') as HTMLInputElement).value;
    const clienteIdStr = (document.getElementById('clienteId') as HTMLInputElement).value;

    const payload: FacturaRequestDTO = {
        puntoVentaId: parseInt((document.getElementById('puntoVentaId') as HTMLSelectElement).value),
        clienteId: clienteIdStr ? parseInt(clienteIdStr) : null,
        listaPrecioId: parseInt((document.getElementById('listaPrecioId') as HTMLSelectElement).value),
        condicionIvaId: parseInt((document.getElementById('condicionIvaId') as HTMLSelectElement).value),
        tipoMonedaId: parseInt((document.getElementById('tipoMonedaId') as HTMLSelectElement).value),
        observaciones: (document.getElementById('observaciones') as HTMLInputElement).value.trim(),
        detalles: detallesFactura.map(d => ({
            listaPrecioArticuloId: d.listaPrecioArticuloId,
            cantidad: d.cantidad,
            porcentajeBonificacion: d.porcentajeBonificacion
        }))
    };

    const btnSubmit = document.getElementById('btnGuardarFactura') as HTMLButtonElement;
    btnSubmit.disabled = true;

    const exito = editIdStr
        ? await facturaService.actualizarFactura(parseInt(editIdStr), payload)
        : await facturaService.crearFactura(payload);

    btnSubmit.disabled = false;

    if (exito) {
        const modal = document.getElementById('modalFacturaForm') as HTMLElement;
        modal.style.display = 'none';

        if (editIdStr) {
            mostrarToast(`Borrador #${editIdStr} actualizado`, 'Los cambios se guardaron correctamente.');
        } else {
            mostrarToast('Factura Guardada Sin Emitir', 'Ya podés validarla con ARCA desde Sin emitir.');
        }

        cambiarVistaActiva('SIN_EMITIR');
    } else {
        mostrarToast('Error al guardar', 'Verificá los datos del comprobante e intentá nuevamente.', 'error');
    }
}

// =========================================================
// GRILLA PRINCIPAL, PAGINACIÓN Y ACCIONES
// =========================================================
async function cargarFacturas() {
    const pageData = await facturaService.obtenerFacturas(tabFacturacionActual, paginaActual, tamanioPagina, filtrosActuales);
    const facturas: FacturaReporteDTO[] = pageData.content || [];
    totalPaginas = Math.max(pageData.totalPages || 1, 1);
    totalElementos = pageData.totalElements || 0;

    renderizarTablaFacturas(facturas);
    actualizarPaginacion(facturas.length);
}

function actualizarPaginacion(cantidadEnPagina: number) {
    const btnPrev = document.getElementById('btnPrevPage') as HTMLButtonElement;
    const btnNext = document.getElementById('btnNextPage') as HTMLButtonElement;
    const pageInfo = document.getElementById('pageInfo');
    const rangoSpan = document.getElementById('rangoRegistros');

    if (btnPrev) btnPrev.disabled = paginaActual === 0;
    if (btnNext) btnNext.disabled = paginaActual >= totalPaginas - 1;
    if (pageInfo) pageInfo.textContent = `Página ${paginaActual + 1} de ${totalPaginas}`;

    if (rangoSpan) {
        if (totalElementos === 0) {
            rangoSpan.textContent = '0–0 de 0';
        } else {
            const desde = paginaActual * tamanioPagina + 1;
            const hasta = desde + cantidadEnPagina - 1;
            rangoSpan.textContent = `${desde}–${hasta} de ${totalElementos}`;
        }
    }
}

function renderizarTablaFacturas(facturas: FacturaReporteDTO[]) {
    const tbody = document.getElementById('tbodyFacturas');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (facturas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center muted-italic" style="padding: 32px;">No hay comprobantes para mostrar en esta sección.</td></tr>`;
        return;
    }

    facturas.forEach(f => {
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
        } else if (esEmitida) {
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
        } else if (esEmitida && !esEliminada) {
            botonesAccion += `
                <button type="button" class="btn-row" onclick="imprimirFactura(${f.id})" title="Descargar PDF">📄 PDF</button>
            `;
        } else if (esEliminada) {
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
            <td class="text-center">${f.cantidadItems ?? 0}</td>
            <td>${badgeEstado}</td>
            <td class="text-right">
                <div class="row-actions">${botonesAccion}</div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarChipsFiltros() {
    const bar = document.getElementById('activeFiltersBar') as HTMLElement;
    const chipsContainer = document.getElementById('activeFiltersChips') as HTMLElement;
    const badge = document.getElementById('badgeFiltrosActivos') as HTMLElement;

    const entries: string[] = [];
    if (filtrosActuales.cliente) entries.push(`Cliente: ${filtrosActuales.cliente}`);
    if (filtrosActuales.numero) entries.push(`N.º: ${filtrosActuales.numero}`);
    if (filtrosActuales.fechaDesde) entries.push(`Desde: ${filtrosActuales.fechaDesde}`);
    if (filtrosActuales.fechaHasta) entries.push(`Hasta: ${filtrosActuales.fechaHasta}`);
    if (filtrosActuales.montoMinimo) entries.push(`Monto ≥ $${filtrosActuales.montoMinimo}`);

    if (entries.length === 0) {
        bar.style.display = 'none';
        badge.style.display = 'none';
    } else {
        bar.style.display = 'flex';
        badge.style.display = 'inline-block';
        badge.textContent = String(entries.length);
        chipsContainer.innerHTML = entries.map(txt => `<span class="filter-chip">${txt}</span>`).join('');
    }
}

// =========================================================
// ACCIONES SOBRE COMPROBANTES
// =========================================================
export const verDetalleFactura = async (id: number) => {
    const f = await facturaService.obtenerFacturaPorId(id);
    if (!f) {
        mostrarToast('Error', 'No se pudo cargar el detalle del comprobante.', 'error');
        return;
    }

    const modal = document.getElementById('modalDetalleFactura') as HTMLElement;
    const titulo = document.getElementById('detalleTitulo') as HTMLElement;
    const estadoBadge = document.getElementById('detalleEstadoBadge') as HTMLElement;
    const body = document.getElementById('detalleBodyContent') as HTMLElement;

    const esEmitida = f.estado === 'EMITIDA' && Boolean(f.cae);
    const esEliminada = tabFacturacionActual === 'ELIMINADAS' || f.estado === 'ANULADA';

    titulo.textContent = f.numero
        ? `Factura ${completarCeros(f.puntoVentaNumero, 4)}-${completarCeros(f.numero, 8)}`
        : `Borrador #${f.id}`;

    if (esEliminada) {
        estadoBadge.textContent = 'Eliminada';
        estadoBadge.className = 'status-pill status-eliminada';
    } else if (esEmitida) {
        estadoBadge.textContent = 'Emitida';
        estadoBadge.className = 'status-pill status-emitida';
    } else {
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
                <span class="meta-value">${f.numero ?? 'Se asigna al emitir'}</span>
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
};
(window as any).verDetalleFactura = verDetalleFactura;

export const informarArca = async (id: number, monto: number = 0, desdeModalDetalle: boolean = false) => {
    const confirmado = await pedirConfirmacion(
        'Emitir factura',
        'Se validará el comprobante con ARCA y, si es aprobado, se le asignará número oficial y CAE. Una vez emitida no podrá editarse ni eliminarse.',
        monto > 0 ? `🚀 Emitir · ${formatearPesos(monto)}` : '🚀 Emitir ahora',
        false
    );

    if (!confirmado) return;

    const res = await facturaService.informarArca(id);
    if (res.ok) {
        const sub = res.data?.cae
            ? `Comprobante ${res.data.numero} · CAE: ${res.data.cae}`
            : 'Comprobante autorizado con CAE oficial.';
        mostrarToast('Factura Emitida Por ARCA', sub, 'success');

        if (desdeModalDetalle) {
            const modalDetalle = document.getElementById('modalDetalleFactura');
            if (modalDetalle) modalDetalle.style.display = 'none';
        }
        await cargarFacturas();
    } else {
        mostrarToast('Rechazo o error de emisión', res.mensaje || 'No se pudo validar en ARCA.', 'error');
    }
};
(window as any).informarArca = informarArca;

export const eliminarComprobante = async (id: number) => {
    const confirmado = await pedirConfirmacion(
        'Eliminar factura',
        `El borrador #${id} se dará de baja sin borrar sus datos y aparecerá en Eliminadas.`,
        '🗑️ Confirmar',
        true
    );

    if (!confirmado) return;

    const exito = await facturaService.eliminarFactura(id);
    if (exito) {
        mostrarToast('Factura Dada De Baja', `Borrador #${id} ahora aparece en Eliminadas.`, 'success');
        await cargarFacturas();
    } else {
        mostrarToast('Error al eliminar', 'No se pudo dar de baja el borrador.', 'error');
    }
};
(window as any).eliminarComprobante = eliminarComprobante;

export const restaurarComprobante = async (id: number, desdeModalDetalle: boolean = false) => {
    const exito = await facturaService.restaurarFactura(id);
    if (exito) {
        mostrarToast('Factura Restaurada', `El borrador #${id} volvió a Sin emitir.`, 'success');
        if (desdeModalDetalle) {
            const modalDetalle = document.getElementById('modalDetalleFactura');
            if (modalDetalle) modalDetalle.style.display = 'none';
        }
        await cargarFacturas();
    } else {
        mostrarToast('Atención', 'Agregá el endpoint PUT /api/facturas/{id}/restaurar en el backend para restaurar borradores.', 'warning');
    }
};
(window as any).restaurarComprobante = restaurarComprobante;

export const eliminarComprobanteDefinitivo = async (id: number) => {
    const confirmado = await pedirConfirmacion(
        'Eliminar definitivamente',
        `El borrador #${id} y sus detalles se eliminarán definitivamente. Esta acción no se puede deshacer.`,
        '🗑️ Eliminar definitivamente',
        true
    );

    if (!confirmado) return;

    const exito = await facturaService.eliminarFacturaDefinitiva(id);
    if (exito) {
        mostrarToast('Borrador eliminado definitivamente', `Borrador #${id} eliminado.`, 'success');
        await cargarFacturas();
    } else {
        mostrarToast('Atención', 'Agregá el endpoint DELETE /api/facturas/{id}/definitivo en el backend.', 'warning');
    }
};
(window as any).eliminarComprobanteDefinitivo = eliminarComprobanteDefinitivo;

export const imprimirFactura = (id: number) => {
    window.open(`http://localhost:8080/api/facturas/${id}/pdf`, '_blank');
};
(window as any).imprimirFactura = imprimirFactura;

// =========================================================
// SECCIÓN OPERACIÓN: CLIENTES, ARTÍCULOS, MARCAS Y RUBROS
// =========================================================
function inicializarEventosOperacion() {
    // --- CLIENTES ---
    document.getElementById('btnNuevoCliente')?.addEventListener('click', () => abrirModalClienteOp());
    document.getElementById('closeModalClienteOp')?.addEventListener('click', () => {
        (document.getElementById('modalFormClienteOp') as HTMLElement).style.display = 'none';
    });
    document.getElementById('inputBuscarClienteOp')?.addEventListener('input', renderizarTablaClientesOperacion);
    document.getElementById('filtroEstadoClienteOp')?.addEventListener('change', renderizarTablaClientesOperacion);
    document.getElementById('ordenClienteOp')?.addEventListener('change', renderizarTablaClientesOperacion);
    document.getElementById('formClienteOp')?.addEventListener('submit', guardarClienteOperacion);

    // --- ARTÍCULOS ---
    document.getElementById('btnNuevoArticuloOp')?.addEventListener('click', () => abrirModalArticuloOp());
    document.getElementById('closeModalArticuloOp')?.addEventListener('click', () => {
        (document.getElementById('modalFormArticuloOp') as HTMLElement).style.display = 'none';
    });
    document.getElementById('inputBuscarArticuloOp')?.addEventListener('input', renderizarTablaArticulosOperacion);
    document.getElementById('filtroEstadoArticuloOp')?.addEventListener('change', renderizarTablaArticulosOperacion);
    document.getElementById('filtroListaArticuloOp')?.addEventListener('change', renderizarTablaArticulosOperacion);

    const chkMin = document.getElementById('chkListaMinorista') as HTMLInputElement;
    const inpMin = document.getElementById('inputPrecioMinorista') as HTMLInputElement;
    chkMin?.addEventListener('change', () => {
        inpMin.disabled = !chkMin.checked;
        if (!chkMin.checked) inpMin.value = '';
    });

    const chkMay = document.getElementById('chkListaMayorista') as HTMLInputElement;
    const inpMay = document.getElementById('inputPrecioMayorista') as HTMLInputElement;
    chkMay?.addEventListener('change', () => {
        inpMay.disabled = !chkMay.checked;
        if (!chkMay.checked) inpMay.value = '';
    });

    document.getElementById('formArticuloOp')?.addEventListener('submit', guardarArticuloOperacion);

    // --- MARCAS ---
    document.getElementById('btnNuevaMarcaOp')?.addEventListener('click', () => abrirModalMarcaOp());
    document.getElementById('closeModalMarcaOp')?.addEventListener('click', () => {
        (document.getElementById('modalFormMarcaOp') as HTMLElement).style.display = 'none';
    });
    document.getElementById('inputBuscarMarcaOp')?.addEventListener('input', renderizarTablaMarcasOperacion);
    document.getElementById('filtroEstadoMarcaOp')?.addEventListener('change', renderizarTablaMarcasOperacion);
    document.getElementById('formMarcaOp')?.addEventListener('submit', guardarMarcaOperacion);

    // --- RUBROS ---
    document.getElementById('btnNuevoRubroOp')?.addEventListener('click', () => abrirModalRubroOp());
    document.getElementById('closeModalRubroOp')?.addEventListener('click', () => {
        (document.getElementById('modalFormRubroOp') as HTMLElement).style.display = 'none';
    });
    document.getElementById('inputBuscarRubroOp')?.addEventListener('input', renderizarTablaRubrosOperacion);
    document.getElementById('filtroEstadoRubroOp')?.addEventListener('change', renderizarTablaRubrosOperacion);
    document.getElementById('formRubroOp')?.addEventListener('submit', guardarRubroOperacion);
}

// --- CLIENTES (RENDER + CRUD) ---
function renderizarTablaClientesOperacion() {
    const tbody = document.getElementById('tbodyClientesOp');
    if (!tbody) return;

    const q = ((document.getElementById('inputBuscarClienteOp') as HTMLInputElement)?.value || '').toLowerCase().trim();
    const estado = (document.getElementById('filtroEstadoClienteOp') as HTMLSelectElement)?.value || 'ACTIVOS';
    const orden = (document.getElementById('ordenClienteOp') as HTMLSelectElement)?.value || 'RECIENTES';

    let lista = clientesLista.filter(c => {
        const esActivo = c.activo !== false;
        if (estado === 'ACTIVOS' && !esActivo) return false;
        if (estado === 'BAJA' && esActivo) return false;
        if (!q) return true;
        return (
            c.denominacion.toLowerCase().indexOf(q) !== -1 ||
            (c.cuitCuil && c.cuitCuil.toLowerCase().indexOf(q) !== -1) ||
            (c.email && c.email.toLowerCase().indexOf(q) !== -1) ||
            (c.domicilio && c.domicilio.toLowerCase().indexOf(q) !== -1)
        );
    });

    if (orden === 'NOMBRE') {
        lista = [...lista].sort((a, b) => a.denominacion.localeCompare(b.denominacion));
    } else {
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

export const abrirModalClienteOp = (id?: number) => {
    const modal = document.getElementById('modalFormClienteOp') as HTMLElement;
    const titulo = document.getElementById('tituloModalClienteOp') as HTMLElement;
    const form = document.getElementById('formClienteOp') as HTMLFormElement;
    form.reset();

    if (id) {
        const cli = clientesLista.find(c => c.id === id);
        if (!cli) return;
        titulo.textContent = 'Editar cliente';
        (document.getElementById('editClienteOpId') as HTMLInputElement).value = String(cli.id);
        (document.getElementById('cliTipoDoc') as HTMLSelectElement).value = cli.tipoDocumento || 'CUIT';
        (document.getElementById('cliCuit') as HTMLInputElement).value = cli.cuitCuil || '';
        (document.getElementById('cliDenominacion') as HTMLInputElement).value = cli.denominacion || '';
        (document.getElementById('cliCondicionIva') as HTMLSelectElement).value = String(cli.condicionIvaId || 2);
        (document.getElementById('cliListaPrecio') as HTMLSelectElement).value = String(cli.listaPrecioPredeterminadaId || 1);
        (document.getElementById('cliTelefono') as HTMLInputElement).value = cli.telefono || '';
        (document.getElementById('cliCelular') as HTMLInputElement).value = cli.celular || '';
        (document.getElementById('cliEmail') as HTMLInputElement).value = cli.email || '';
        (document.getElementById('cliCalle') as HTMLInputElement).value = cli.calle || '';
        (document.getElementById('cliNumero') as HTMLInputElement).value = cli.numero || '';
    } else {
        titulo.textContent = 'Nuevo cliente';
        (document.getElementById('editClienteOpId') as HTMLInputElement).value = '';
    }

    modal.style.display = 'flex';
};
(window as any).abrirModalClienteOp = abrirModalClienteOp;

async function guardarClienteOperacion(e: Event) {
    e.preventDefault();
    const idStr = (document.getElementById('editClienteOpId') as HTMLInputElement).value;
    const cuit = (document.getElementById('cliCuit') as HTMLInputElement).value.trim();
    const soloDigitos = cuit.replace(/\D/g, '');

    if (soloDigitos.length !== 11 && soloDigitos.length !== 8) {
        mostrarToast('Documento inválido', 'En homologación ARCA el CUIT/CUIL debe contener 11 dígitos.', 'warning');
        return;
    }

    const condSelect = document.getElementById('cliCondicionIva') as HTMLSelectElement;
    const listaSelect = document.getElementById('cliListaPrecio') as HTMLSelectElement;

    const payload: Partial<ClienteDTO> = {
        tipoDocumento: (document.getElementById('cliTipoDoc') as HTMLSelectElement).value,
        cuitCuil: cuit,
        denominacion: (document.getElementById('cliDenominacion') as HTMLInputElement).value.trim(),
        condicionIvaId: parseInt(condSelect.value),
        condicionIva: condSelect.options[condSelect.selectedIndex]?.text || 'Consumidor Final',
        listaPrecioPredeterminadaId: parseInt(listaSelect.value),
        listaPrecioNombre: listaSelect.options[listaSelect.selectedIndex]?.text || 'Precio minorista',
        telefono: (document.getElementById('cliTelefono') as HTMLInputElement).value.trim(),
        celular: (document.getElementById('cliCelular') as HTMLInputElement).value.trim(),
        email: (document.getElementById('cliEmail') as HTMLInputElement).value.trim(),
        calle: (document.getElementById('cliCalle') as HTMLInputElement).value.trim(),
        numero: (document.getElementById('cliNumero') as HTMLInputElement).value.trim()
    };

    const guardado = await facturaService.guardarCliente(payload, idStr ? parseInt(idStr) : undefined);
    await cargarClientes();
    renderizarTablaClientesOperacion();

    (document.getElementById('modalFormClienteOp') as HTMLElement).style.display = 'none';
    mostrarToast(idStr ? 'Cliente Actualizado' : 'Cliente Creado', guardado.denominacion, 'success');
}

export const toggleEstadoClienteOp = async (id: number) => {
    const cli = clientesLista.find(c => c.id === id);
    if (!cli) return;
    const nuevoEstado = cli.activo === false;

    const ok = await pedirConfirmacion(
        nuevoEstado ? 'Activar cliente' : 'Dar de baja cliente',
        nuevoEstado
            ? `¿Deseás reactivar a "${cli.denominacion}" para facturación?`
            : `El cliente "${cli.denominacion}" dejará de aparecer en el buscador de nuevas facturas.`,
        nuevoEstado ? 'Activar' : 'Dar de baja',
        !nuevoEstado
    );
    if (!ok) return;

    await facturaService.cambiarEstadoCliente(cli, nuevoEstado);
    await cargarClientes();
    renderizarTablaClientesOperacion();
    mostrarToast(nuevoEstado ? 'Cliente activado' : 'Cliente dado de baja', cli.denominacion);
};
(window as any).toggleEstadoClienteOp = toggleEstadoClienteOp;

// --- ARTÍCULOS (RENDER + ALTA CON LISTAS) ---
function renderizarTablaArticulosOperacion() {
    const tbody = document.getElementById('tbodyArticulosOp');
    if (!tbody) return;

    const q = ((document.getElementById('inputBuscarArticuloOp') as HTMLInputElement)?.value || '').toLowerCase().trim();
    const estado = (document.getElementById('filtroEstadoArticuloOp') as HTMLSelectElement)?.value || 'ACTIVOS';
    const listaId = (document.getElementById('filtroListaArticuloOp') as HTMLSelectElement)?.value || 'TODAS';

    const filtrados = catalogoCompleto.filter(a => {
        const esActivo = a.activo !== false;
        if (estado === 'ACTIVOS' && !esActivo) return false;
        if (estado === 'BAJA' && esActivo) return false;
        if (listaId !== 'TODAS' && String(a.listaPrecioId) !== listaId) return false;
        if (!q) return true;
        return (
            a.articuloNombre.toLowerCase().indexOf(q) !== -1 ||
            (a.articuloCodigo && a.articuloCodigo.toLowerCase().indexOf(q) !== -1) ||
            (a.rubroNombre && a.rubroNombre.toLowerCase().indexOf(q) !== -1) ||
            (a.marcaNombre && a.marcaNombre.toLowerCase().indexOf(q) !== -1)
        );
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
    const form = document.getElementById('formArticuloOp') as HTMLFormElement;
    form.reset();

    const selRubro = document.getElementById('artRubroSelect') as HTMLSelectElement;
    selRubro.innerHTML = rubrosLista
        .filter(r => r.activo !== false)
        .map(r => `<option value="${r.id}">${r.codigo} - ${r.denominacion}</option>`)
        .join('');

    const selMarca = document.getElementById('artMarcaSelect') as HTMLSelectElement;
    selMarca.innerHTML = marcasLista
        .filter(m => m.activo !== false)
        .map(m => `<option value="${m.id}">${m.codigo} - ${m.denominacion}</option>`)
        .join('');

    const chkMin = document.getElementById('chkListaMinorista') as HTMLInputElement;
    const inpMin = document.getElementById('inputPrecioMinorista') as HTMLInputElement;
    chkMin.checked = true;
    inpMin.disabled = false;

    const chkMay = document.getElementById('chkListaMayorista') as HTMLInputElement;
    const inpMay = document.getElementById('inputPrecioMayorista') as HTMLInputElement;
    chkMay.checked = false;
    inpMay.disabled = true;

    (document.getElementById('modalFormArticuloOp') as HTMLElement).style.display = 'flex';
}

async function guardarArticuloOperacion(e: Event) {
    e.preventDefault();
    const denominacion = (document.getElementById('artDenominacion') as HTMLInputElement).value.trim();
    const chkMin = (document.getElementById('chkListaMinorista') as HTMLInputElement).checked;
    const chkMay = (document.getElementById('chkListaMayorista') as HTMLInputElement).checked;

    if (!chkMin && !chkMay) {
        mostrarToast('Selecciona Al Menos Una Lista De Precios', 'Activá Lista minorista, Lista mayorista o ambas.', 'warning');
        return;
    }

    const precioMin = chkMin ? parseFloat((document.getElementById('inputPrecioMinorista') as HTMLInputElement).value) : null;
    const precioMay = chkMay ? parseFloat((document.getElementById('inputPrecioMayorista') as HTMLInputElement).value) : null;

    if (chkMin && (!precioMin || isNaN(precioMin) || precioMin <= 0)) {
        mostrarToast('Precio minorista inválido', 'Ingresá un importe mayor a 0 para la lista minorista.', 'warning');
        return;
    }

    if (chkMay && (!precioMay || isNaN(precioMay) || precioMay <= 0)) {
        mostrarToast('Precio mayorista inválido', 'Ingresá un importe mayor a 0 para la lista mayorista.', 'warning');
        return;
    }

    const selRubro = document.getElementById('artRubroSelect') as HTMLSelectElement;
    const selMarca = document.getElementById('artMarcaSelect') as HTMLSelectElement;
    const rubroObj = rubrosLista.find(r => r.id === parseInt(selRubro.value));
    const marcaObj = marcasLista.find(m => m.id === parseInt(selMarca.value));

    await facturaService.crearArticulo({
        denominacion,
        rubroId: rubroObj?.id || 1,
        rubroNombre: rubroObj?.denominacion || 'General',
        marcaId: marcaObj?.id || 1,
        marcaNombre: marcaObj?.denominacion || 'Genérica',
        precioMinorista: precioMin,
        precioMayorista: precioMay
    });

    await cargarCatalogo();
    renderizarTablaArticulosOperacion();
    (document.getElementById('modalFormArticuloOp') as HTMLElement).style.display = 'none';
    mostrarToast('Artículo Creado', `${denominacion} ya está disponible para facturar.`, 'success');
}

export const toggleEstadoArticuloOp = async (lpaId: number) => {
    const item = catalogoCompleto.find(a => a.id === lpaId);
    if (!item) return;
    const nuevoEstado = item.activo === false;

    await facturaService.cambiarEstadoArticulo(item, nuevoEstado);
    await cargarCatalogo();
    renderizarTablaArticulosOperacion();
    mostrarToast(nuevoEstado ? 'Artículo activado' : 'Artículo dado de baja', `${item.articuloNombre} (${item.listaNombre})`);
};
(window as any).toggleEstadoArticuloOp = toggleEstadoArticuloOp;

// --- MARCAS ---
function renderizarTablaMarcasOperacion() {
    const tbody = document.getElementById('tbodyMarcasOp');
    if (!tbody) return;

    const q = ((document.getElementById('inputBuscarMarcaOp') as HTMLInputElement)?.value || '').toLowerCase().trim();
    const estado = (document.getElementById('filtroEstadoMarcaOp') as HTMLSelectElement)?.value || 'ACTIVOS';

    const filtradas = marcasLista.filter(m => {
        if (estado === 'ACTIVOS' && !m.activo) return false;
        if (estado === 'BAJA' && m.activo) return false;
        if (!q) return true;
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

export const abrirModalMarcaOp = (id?: number) => {
    const modal = document.getElementById('modalFormMarcaOp') as HTMLElement;
    const titulo = document.getElementById('tituloModalMarcaOp') as HTMLElement;
    const inputId = document.getElementById('editMarcaOpId') as HTMLInputElement;
    const inputDenom = document.getElementById('marcaDenominacion') as HTMLInputElement;

    if (id) {
        const m = marcasLista.find(x => x.id === id);
        if (!m) return;
        titulo.textContent = 'Editar marca';
        inputId.value = String(m.id);
        inputDenom.value = m.denominacion;
    } else {
        titulo.textContent = 'Nueva marca';
        inputId.value = '';
        inputDenom.value = '';
    }
    modal.style.display = 'flex';
    inputDenom.focus();
};
(window as any).abrirModalMarcaOp = abrirModalMarcaOp;

async function guardarMarcaOperacion(e: Event) {
    e.preventDefault();
    const idStr = (document.getElementById('editMarcaOpId') as HTMLInputElement).value;
    const denom = (document.getElementById('marcaDenominacion') as HTMLInputElement).value.trim();
    if (!denom) return;

    await facturaService.guardarMarca(denom, idStr ? parseInt(idStr) : undefined);
    await cargarMarcas();
    renderizarTablaMarcasOperacion();
    (document.getElementById('modalFormMarcaOp') as HTMLElement).style.display = 'none';
    mostrarToast(idStr ? 'Marca Actualizada' : 'Marca Creada', denom, 'success');
}

export const toggleEstadoMarcaOp = async (id: number) => {
    const m = marcasLista.find(x => x.id === id);
    if (!m) return;
    await facturaService.cambiarEstadoMarca(id, !m.activo);
    await cargarMarcas();
    renderizarTablaMarcasOperacion();
    mostrarToast(!m.activo ? 'Marca activada' : 'Marca dada de baja', m.denominacion);
};
(window as any).toggleEstadoMarcaOp = toggleEstadoMarcaOp;

// --- RUBROS ---
function renderizarTablaRubrosOperacion() {
    const tbody = document.getElementById('tbodyRubrosOp');
    if (!tbody) return;

    const q = ((document.getElementById('inputBuscarRubroOp') as HTMLInputElement)?.value || '').toLowerCase().trim();
    const estado = (document.getElementById('filtroEstadoRubroOp') as HTMLSelectElement)?.value || 'ACTIVOS';

    const filtrados = rubrosLista.filter(r => {
        if (estado === 'ACTIVOS' && !r.activo) return false;
        if (estado === 'BAJA' && r.activo) return false;
        if (!q) return true;
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

export const abrirModalRubroOp = (id?: number) => {
    const modal = document.getElementById('modalFormRubroOp') as HTMLElement;
    const titulo = document.getElementById('tituloModalRubroOp') as HTMLElement;
    const inputId = document.getElementById('editRubroOpId') as HTMLInputElement;
    const inputDenom = document.getElementById('rubroDenominacion') as HTMLInputElement;

    if (id) {
        const r = rubrosLista.find(x => x.id === id);
        if (!r) return;
        titulo.textContent = 'Editar rubro';
        inputId.value = String(r.id);
        inputDenom.value = r.denominacion;
    } else {
        titulo.textContent = 'Nuevo rubro';
        inputId.value = '';
        inputDenom.value = '';
    }
    modal.style.display = 'flex';
    inputDenom.focus();
};
(window as any).abrirModalRubroOp = abrirModalRubroOp;

async function guardarRubroOperacion(e: Event) {
    e.preventDefault();
    const idStr = (document.getElementById('editRubroOpId') as HTMLInputElement).value;
    const denom = (document.getElementById('rubroDenominacion') as HTMLInputElement).value.trim();
    if (!denom) return;

    await facturaService.guardarRubro(denom, idStr ? parseInt(idStr) : undefined);
    await cargarRubros();
    renderizarTablaRubrosOperacion();
    (document.getElementById('modalFormRubroOp') as HTMLElement).style.display = 'none';
    mostrarToast(idStr ? 'Rubro Actualizado' : 'Rubro Creado', denom, 'success');
}

export const toggleEstadoRubroOp = async (id: number) => {
    const r = rubrosLista.find(x => x.id === id);
    if (!r) return;
    await facturaService.cambiarEstadoRubro(id, !r.activo);
    await cargarRubros();
    renderizarTablaRubrosOperacion();
    mostrarToast(!r.activo ? 'Rubro activado' : 'Rubro dado de baja', r.denominacion);
};
(window as any).toggleEstadoRubroOp = toggleEstadoRubroOp;