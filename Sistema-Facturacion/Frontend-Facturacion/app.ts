import { FacturaService, FiltrosBusqueda } from './FacturaService.js';
import { FacturaDetalleRequestDTO, FacturaRequestDTO, FacturaReporteDTO, ArticuloCatalogoDTO } from './models/factura.dto.js';

const facturaService = new FacturaService();

interface DetalleUI extends FacturaDetalleRequestDTO {
    articuloNombre: string;
    precioUnitarioUI: number;
    subtotalUI: number;
}

let detallesFactura: DetalleUI[] = [];
let todasLasFacturas: FacturaReporteDTO[] = [];
let filtrosActuales: FiltrosBusqueda = {};

let paginaActual = 0;
let totalPaginas = 1;

document.addEventListener('DOMContentLoaded', async () => {

    const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }

    themeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        }
    });

    const inputFechaEmision = document.getElementById('fechaEmision') as HTMLInputElement;
    if (inputFechaEmision) {
        inputFechaEmision.value = new Date().toLocaleDateString('en-CA');
    }

    const modalCliente = document.getElementById('modalCliente') as HTMLElement;
    const modalArticulo = document.getElementById('modalArticulo') as HTMLElement;

    document.getElementById('btnAbrirModalCliente')?.addEventListener('click', () => {
        if(modalCliente) modalCliente.style.display = 'flex';
    });
    document.getElementById('btnAbrirModalArticulo')?.addEventListener('click', () => {
        if(modalArticulo) modalArticulo.style.display = 'flex';
    });

    document.getElementById('closeModalCliente')?.addEventListener('click', () => {
        if(modalCliente) modalCliente.style.display = 'none';
    });
    document.getElementById('closeModalArticulo')?.addEventListener('click', () => {
        if(modalArticulo) modalArticulo.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (modalCliente && e.target === modalCliente) modalCliente.style.display = 'none';
        if (modalArticulo && e.target === modalArticulo) modalArticulo.style.display = 'none';
    });

    document.getElementById('searchArticuloModal')?.addEventListener('input', (e) => {
        const term = (e.target as HTMLInputElement).value.toLowerCase();
        const rows = document.querySelectorAll('#tbodyArticulosModal tr');
        rows.forEach(row => {
            const text = row.textContent?.toLowerCase() || '';
            (row as HTMLElement).style.display = text.includes(term) ? '' : 'none';
        });
    });

    document.getElementById('searchClienteModal')?.addEventListener('input', (e) => {
        const term = (e.target as HTMLInputElement).value.toLowerCase();
        const rows = document.querySelectorAll('#tbodyClientesModal tr');
        rows.forEach(row => {
            const text = row.textContent?.toLowerCase() || '';
            (row as HTMLElement).style.display = text.includes(term) ? '' : 'none';
        });
    });

    await cargarCatalogo();
    await cargarClientes();
    await cargarFacturas();

    document.getElementById('btnAgregarItem')?.addEventListener('click', agregarDetalle);
    document.getElementById('facturaForm')?.addEventListener('submit', guardarFactura);

    document.getElementById('btnPrevPage')?.addEventListener('click', () => cambiarPagina(-1));
    document.getElementById('btnNextPage')?.addEventListener('click', () => cambiarPagina(1));

    document.getElementById('btnExportarPdf')?.addEventListener('click', () => {
        window.open('http://localhost:8080/api/facturas/exportar/pdf', '_blank');
    });
    document.getElementById('btnExportarExcel')?.addEventListener('click', () => {
        window.open('http://localhost:8080/api/facturas/exportar/excel', '_blank');
    });

    document.getElementById('btnBuscar')?.addEventListener('click', async () => {
        const numVal = (document.getElementById('searchNumero') as HTMLInputElement)?.value.trim();
        const fDesdeVal = (document.getElementById('searchFechaDesde') as HTMLInputElement)?.value;
        const fHastaVal = (document.getElementById('searchFechaHasta') as HTMLInputElement)?.value;
        const clienteVal = (document.getElementById('searchCliente') as HTMLInputElement)?.value.trim();
        const estadoArcaVal = (document.getElementById('searchEstadoArca') as HTMLSelectElement)?.value;

        filtrosActuales = {
            numero: numVal || undefined,
            fechaDesde: fDesdeVal || undefined,
            fechaHasta: fHastaVal || undefined,
            cliente: clienteVal || undefined,
            informadaArca: estadoArcaVal !== '' ? estadoArcaVal : undefined
        };

        paginaActual = 0;
        await cargarFacturas();
    });
});

async function cargarCatalogo() {
    const tbodyArticulos = document.getElementById('tbodyArticulosModal');
    const catalogo = await facturaService.obtenerCatalogo();

    if (!tbodyArticulos || !catalogo || catalogo.length === 0) return;

    tbodyArticulos.innerHTML = '';

    catalogo.forEach((art: ArticuloCatalogoDTO) => {
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
            const target = e.currentTarget as HTMLButtonElement;
            const id = target.getAttribute('data-id');
            const nombre = target.getAttribute('data-nombre');
            const precio = target.getAttribute('data-precio');

            (document.getElementById('articuloIdSelected') as HTMLInputElement).value = id || '';
            (document.getElementById('articuloNombreSelected') as HTMLInputElement).value = nombre || '';
            (document.getElementById('articuloPrecioSelected') as HTMLInputElement).value = precio || '';

            const modalArticulo = document.getElementById('modalArticulo');
            if(modalArticulo) modalArticulo.style.display = 'none';
        });
    });
}

async function cargarClientes() {
    const tbodyClientes = document.getElementById('tbodyClientesModal');
    const clientes = await facturaService.obtenerClientes();

    if (!tbodyClientes || !clientes || clientes.length === 0) return;

    tbodyClientes.innerHTML = '';

    clientes.forEach((cli: any) => {
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
            const target = e.currentTarget as HTMLButtonElement;
            const id = target.getAttribute('data-id');
            const nombre = target.getAttribute('data-nombre');

            (document.getElementById('clienteId') as HTMLInputElement).value = id || '';
            (document.getElementById('clienteNombre') as HTMLInputElement).value = nombre || '';

            const modalCliente = document.getElementById('modalCliente');
            if(modalCliente) modalCliente.style.display = 'none';
        });
    });
}

async function cargarFacturas() {
    const pageData = await facturaService.obtenerFacturas(paginaActual, 5, filtrosActuales);
    todasLasFacturas = pageData.content || [];
    totalPaginas = pageData.totalPages || 1;

    renderizarTablaFacturas(todasLasFacturas);
    actualizarPaginacion();
}

async function cambiarPagina(delta: number) {
    paginaActual += delta;
    if (paginaActual < 0) paginaActual = 0;
    if (paginaActual >= totalPaginas) paginaActual = totalPaginas - 1;
    await cargarFacturas();
}

function actualizarPaginacion() {
    const btnPrev = document.getElementById('btnPrevPage') as HTMLButtonElement;
    const btnNext = document.getElementById('btnNextPage') as HTMLButtonElement;
    const pageInfo = document.getElementById('pageInfo');

    if (btnPrev) btnPrev.disabled = paginaActual === 0;
    if (btnNext) btnNext.disabled = paginaActual >= totalPaginas - 1;
    if (pageInfo) pageInfo.textContent = `Página ${paginaActual + 1} de ${totalPaginas}`;
}

function renderizarTablaFacturas(facturas: FacturaReporteDTO[]) {
    const tbody = document.querySelector('#tablaFacturas tbody');
    if (tbody) {
        tbody.innerHTML = '';
        facturas.forEach(f => {
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
                    <td>$${f.importeTotal?.toFixed(2) || '0.00'}</td>
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
export const imprimirFactura = (id: number) => {
    window.open(`http://localhost:8080/api/facturas/${id}/pdf`, '_blank');
};
(window as any).imprimirFactura = imprimirFactura;

export const informarArca = async (id: number) => {
    if(confirm('¿Desea informar esta factura a ARCA? Esta acción no se puede deshacer.')) {
        const exito = await facturaService.informarArca(id);
        if(exito) {
            alert('Factura informada con éxito. CAE generado.');
            await cargarFacturas();
        } else {
            alert('Error al conectar con ARCA.');
        }
    }
};
(window as any).informarArca = informarArca;

export const eliminarComprobante = async (id: number) => {
    if(confirm('¿Está seguro que desea anular esta factura?')) {
        const exito = await facturaService.eliminarFactura(id);
        if(exito) {
            alert('Factura anulada/eliminada correctamente.');
            await cargarFacturas();
        } else {
            alert('Error al anular la factura.');
        }
    }
};
(window as any).eliminarComprobante = eliminarComprobante;

function agregarDetalle() {
    const inputId = document.getElementById('articuloIdSelected') as HTMLInputElement;
    const inputNombre = document.getElementById('articuloNombreSelected') as HTMLInputElement;
    const inputPrecio = document.getElementById('articuloPrecioSelected') as HTMLInputElement;
    const inputCantidad = document.getElementById('cantidad') as HTMLInputElement;

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
    if (spanSubtotal) spanSubtotal.textContent = totalVisual.toFixed(2);
    if (spanTotal) spanTotal.textContent = totalVisual.toFixed(2);
}

export const eliminarDetalle = (index: number) => {
    detallesFactura.splice(index, 1);
    actualizarTablaDetalles();
};
(window as any).eliminarDetalle = eliminarDetalle;

async function guardarFactura(e: Event) {
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

    const inputFecha = (document.getElementById('fechaEmision') as HTMLInputElement).value;
    const fechaString = inputFecha || new Date().toLocaleDateString('en-CA');

    const facturaData: FacturaRequestDTO = {
        fechaEmision: fechaString,
        puntoVentaId: parseInt((document.getElementById('puntoVentaId') as HTMLSelectElement).value),
        condicionIvaId: parseInt((document.getElementById('condicionIvaId') as HTMLSelectElement).value),
        tipoMonedaId: parseInt((document.getElementById('tipoMonedaId') as HTMLSelectElement).value),
        clienteId: parseInt((document.getElementById('clienteId') as HTMLInputElement).value) || 1,
        observaciones: 'Generada desde UI',
        detalles: detallesParaBackend
    };

    const exito = await facturaService.crearFactura(facturaData);
    if (exito) {
        alert('Factura emitida con éxito.');
        detallesFactura = [];
        actualizarTablaDetalles();

        const spanSubtotal = document.getElementById('importeSubtotal');
        const spanTotal = document.getElementById('importeTotal');
        if (spanSubtotal) spanSubtotal.textContent = "0.00";
        if (spanTotal) spanTotal.textContent = "0.00";

        paginaActual = 0;
        await cargarFacturas();
    } else {
        alert('Error al guardar la factura.');
    }
}