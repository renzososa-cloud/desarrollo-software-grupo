import { FacturaService } from './FacturaService.js';
import { FacturaDetalleRequestDTO, FacturaRequestDTO, FacturaReporteDTO } from './models/factura.dto.js';

const facturaService = new FacturaService();

interface DetalleUI extends FacturaDetalleRequestDTO {
    precioUnitarioUI: number;
    subtotalUI: number;
}

let detallesFactura: DetalleUI[] = [];
let todasLasFacturas: FacturaReporteDTO[] = [];

// Variables de paginación
let paginaActual = 0;
let totalPaginas = 1;

document.addEventListener('DOMContentLoaded', async () => {

    // === Lógica del Tema Claro/Oscuro ===
    const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;

    // Leer preferencia guardada
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
    // ======================================

    await cargarFacturas();

    document.getElementById('btnAgregarItem')?.addEventListener('click', agregarDetalle);
    document.getElementById('facturaForm')?.addEventListener('submit', guardarFactura);

    // Paginación
    document.getElementById('btnPrevPage')?.addEventListener('click', () => cambiarPagina(-1));
    document.getElementById('btnNextPage')?.addEventListener('click', () => cambiarPagina(1));

    // Exportaciones
    document.getElementById('btnExportarPdf')?.addEventListener('click', () => {
        window.open('http://localhost:8080/api/facturas/exportar/pdf', '_blank');
    });
    document.getElementById('btnExportarExcel')?.addEventListener('click', () => {
        window.open('http://localhost:8080/api/facturas/exportar/excel', '_blank');
    });

    document.getElementById('btnBuscar')?.addEventListener('click', () => {
        const termino = (document.getElementById('searchInput') as HTMLInputElement).value.toLowerCase();
        const filtradas = todasLasFacturas.filter(f =>
            f.numeroFactura?.toString().includes(termino) ||
            f.clienteDenominacion?.toLowerCase().includes(termino)
        );
        renderizarTablaFacturas(filtradas);
    });
});

async function cargarFacturas() {
    const pageData = await facturaService.obtenerFacturas(paginaActual, 5);
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
                    </td>
                </tr>
            `;
        });
    }
}

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
    const selectItem = document.getElementById('listaPrecioArticuloId') as HTMLSelectElement;
    const inputCantidad = document.getElementById('cantidad') as HTMLInputElement;
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
    const detallesParaBackend = detallesFactura.map(d => ({ articuloId: d.articuloId, cantidad: d.cantidad, porcentajeBonificacion: d.porcentajeBonificacion }));

    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mesNum = ahora.getMonth() + 1;
    const diaNum = ahora.getDate();

    // Validamos con operador ternario en lugar de padStart para evitar errores de versión en TypeScript
    const mes = mesNum < 10 ? '0' + mesNum : String(mesNum);
    const dia = diaNum < 10 ? '0' + diaNum : String(diaNum);

    const fechaString = `${anio}-${mes}-${dia}`;

    const facturaData: FacturaRequestDTO = {
        fechaEmision: fechaString,
        puntoVentaId: parseInt((document.getElementById('puntoVentaId') as HTMLSelectElement).value),
        condicionIvaId: parseInt((document.getElementById('condicionIvaId') as HTMLSelectElement).value),
        tipoMonedaId: parseInt((document.getElementById('tipoMonedaId') as HTMLSelectElement).value),
        clienteId: 1,
        observaciones: 'Generada desde UI',
        detalles: detallesParaBackend
    };

    const exito = await facturaService.crearFactura(facturaData);
    if (exito) {
        alert('Factura emitida con éxito.');
        detallesFactura = [];
        actualizarTablaDetalles();

        // --- Solución al Problema 2: Blanquear los totales de la UI ---
        const spanSubtotal = document.getElementById('importeSubtotal');
        const spanTotal = document.getElementById('importeTotal');
        if (spanSubtotal) spanSubtotal.textContent = "0.00";
        if (spanTotal) spanTotal.textContent = "0.00";
        // -------------------------------------------------------------

        paginaActual = 0;
        await cargarFacturas();
    } else {
        alert('Error al guardar la factura.');
    }
}