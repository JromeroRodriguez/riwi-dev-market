let categoriaActiva = "";
let terminoBusqueda = "";
let temporizadorBusqueda = null;

const iconosPorCategoria = {
  "Apps web": "🖥️",
  "APIs": "🔌",
  "Plantillas": "🧩",
  "Automatizaciones": "🤖",
};

function initCatalogo() {
  const api = window.RiwiApp?.api;
  api?.renderNavbar("catalogo-nav-links");
  categoriaActiva = "";
  terminoBusqueda = "";
  document.getElementById("catalogo-busqueda").value = "";

  const filtros = document.getElementById("catalogo-filtros-categoria");
  filtros.innerHTML = `<span class="chip activo" data-categoria="">Todas</span>`;
  filtros.querySelector('[data-categoria=""]').addEventListener("click", (e) => {
    seleccionarCategoria("", e.target);
  });

  cargarCategorias();
  cargarProductos();

  const busquedaInput = document.getElementById("catalogo-busqueda");
  busquedaInput.oninput = (e) => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
      terminoBusqueda = e.target.value.trim();
      cargarProductos();
    }, 350);
  };
}

async function cargarCategorias() {
  try {
    const data = await window.RiwiApp.api.apiFetch("/categorias");
    const contenedor = document.getElementById("catalogo-filtros-categoria");

    data.categorias.forEach((cat) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.dataset.categoria = cat.id;
      chip.textContent = cat.nombre;
      chip.addEventListener("click", () => seleccionarCategoria(cat.id, chip));
      contenedor.appendChild(chip);
    });
  } catch (err) {
    console.error(err);
  }
}

function seleccionarCategoria(categoriaId, chipEl) {
  categoriaActiva = categoriaId;
  document.querySelectorAll("#catalogo-filtros-categoria .chip").forEach((c) => c.classList.remove("activo"));
  chipEl.classList.add("activo");
  cargarProductos();
}

async function cargarProductos() {
  const params = new URLSearchParams();
  if (categoriaActiva) params.set("categoria_id", categoriaActiva);
  if (terminoBusqueda) params.set("q", terminoBusqueda);

  const grid = document.getElementById("catalogo-grid-productos");
  const vacio = document.getElementById("catalogo-vacio");

  try {
    const data = await window.RiwiApp.api.apiFetch(`/productos?${params.toString()}`, { authOptional: true });
    grid.innerHTML = "";

    if (!data.productos.length) {
      vacio.textContent = "No se encontraron productos con esos filtros.";
      vacio.style.display = "block";
      return;
    }
    vacio.style.display = "none";

    data.productos.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card-producto";
      card.addEventListener("click", () => {
        window.RiwiApp.router.navegarA(`producto/${p.id}`);
      });

      const icono = iconosPorCategoria[p.categoria] || "📦";
      const promedio = Number(p.calificacion_promedio).toFixed(1);

      card.innerHTML = `
        <div class="portada-contenedor">
          <img class="portada-img" src="${window.RiwiApp.api.obtenerImagenUrl(p.url_imagen, p.categoria)}" alt="${p.titulo}">
        </div>
        <p class="titulo">${p.titulo}</p>
        <p class="categoria">${p.categoria}</p>
        <div class="footer-card">
          <span>${window.RiwiApp.api.formatoMoneda(p.precio)}</span>
          <span>⭐ ${p.total_calificaciones > 0 ? promedio : "—"}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = "";
    vacio.textContent = `No se pudo cargar el catálogo: ${err.message}`;
    vacio.style.display = "block";
    console.error(err);
  }
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.catalogo = initCatalogo;
