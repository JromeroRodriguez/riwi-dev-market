function initDashboardVendedor() {
  const usuario = window.RiwiApp?.api?.protegerPagina(["vendedor", "administrador"]);
  if (!usuario) return;
  window.RiwiApp?.api?.renderNavbar("dv-nav-links");

  cargarEstadisticasVendedor();
  cargarCategoriasSelect();
  cargarMisProductos();

  const formProducto = document.getElementById("dv-form-producto");
  if (!formProducto || formProducto.dataset.bound === "true") return;

  formProducto.dataset.bound = "true";
  formProducto.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      titulo: document.getElementById("dv-titulo").value.trim(),
      descripcion: document.getElementById("dv-descripcion").value.trim(),
      categoria_id: document.getElementById("dv-categoria_id").value,
      precio: parseFloat(document.getElementById("dv-precio").value),
      url_repositorio: document.getElementById("dv-url_repositorio").value.trim(),
    };

    alertaCargando("Publicando producto...");

    try {
      await window.RiwiApp.api.apiFetch("/productos", { method: "POST", auth: true, body });
      await alertaExito("Queda pendiente de revisión por el administrador.", "Producto publicado");
      formProducto.reset();
      document.getElementById("dv-form-nuevo-producto").style.display = "none";
      cargarMisProductos();
      cargarEstadisticasVendedor();
    } catch (err) {
      alertaError(err.message, "No se pudo publicar el producto");
    }
  });
}

async function cargarEstadisticasVendedor() {
  try {
    const data = await window.RiwiApp.api.apiFetch("/estadisticas/vendedor", { auth: true });
    const r = data.resumen;
    document.getElementById("dv-stats-vendedor").innerHTML = `
      <div class="stat-card"><p class="label">Productos publicados</p><p class="valor">${r.productos_publicados}</p></div>
      <div class="stat-card"><p class="label">Ventas totales</p><p class="valor">${r.total_ventas}</p></div>
      <div class="stat-card"><p class="label">Ingresos totales</p><p class="valor">${window.RiwiApp.api.formatoMoneda(r.ingresos_totales)}</p></div>
      <div class="stat-card"><p class="label">Calificación promedio</p><p class="valor">${Number(r.calificacion_promedio).toFixed(1)} ⭐</p></div>
    `;
  } catch (err) {
    console.error(err);
  }
}

async function cargarCategoriasSelect() {
  const data = await window.RiwiApp.api.apiFetch("/categorias");
  const select = document.getElementById("dv-categoria_id");
  select.innerHTML = data.categorias.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join("");
}

async function cargarMisProductos() {
  const contenedor = document.getElementById("dv-lista-mis-productos");
  try {
    const data = await window.RiwiApp.api.apiFetch("/productos/mios", { auth: true });

    if (!data.productos.length) {
      contenedor.innerHTML = `<p class="vacio">Todavía no has publicado ningún producto.</p>`;
      return;
    }

    contenedor.innerHTML = data.productos.map((p) => `
      <div class="lista-item">
        <div>
          <p style="font-weight:600;margin:0">${p.titulo}</p>
          <p class="info-secundaria">${p.categoria} · ${window.RiwiApp.api.formatoMoneda(p.precio)}</p>
          ${p.estado === "rechazado" && p.motivo_rechazo ? `<p class="info-secundaria" style="color:var(--color-danger-text)">Motivo: ${p.motivo_rechazo}</p>` : ""}
        </div>
        <span class="badge ${p.estado}">${etiquetaEstado(p.estado)}</span>
      </div>
    `).join("");
  } catch (err) {
    contenedor.innerHTML = `<p class="vacio">${err.message}</p>`;
  }
}

function etiquetaEstado(estado) {
  const etiquetas = {
    en_revision: "En revisión",
    publicado: "Publicado",
    vendido: "Vendido",
    rechazado: "Rechazado",
    archivado: "Archivado",
  };
  return etiquetas[estado] || estado;
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.dashboardVendedor = initDashboardVendedor;