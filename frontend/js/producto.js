function initProducto(productoId) {
  window.RiwiApp?.api?.renderNavbar("producto-nav-links");
  productoIdActual = productoId;
  const contenedor = document.getElementById("producto-contenedor");

  if (!productoId) {
    contenedor.innerHTML = `<p class="vacio">Producto no especificado.</p>`;
    return;
  }

  contenedor.innerHTML = `<p class="vacio">Cargando producto...</p>`;
  cargarProducto(productoId);
}

async function cargarProducto(productoId) {
  const contenedor = document.getElementById("producto-contenedor");
  try {
    const [dataProducto, dataCalificaciones] = await Promise.all([
      window.RiwiApp.api.apiFetch(`/productos/${productoId}`),
      window.RiwiApp.api.apiFetch(`/productos/${productoId}/calificaciones`),
    ]);

    renderProducto(dataProducto.producto, dataCalificaciones.calificaciones);
  } catch (err) {
    contenedor.innerHTML = `<p class="vacio">${err.message}</p>`;
  }
}

function renderProducto(p, calificaciones) {
  const contenedor = document.getElementById("producto-contenedor");
  const usuario = window.RiwiApp.api.obtenerUsuario();
  const esDueno = usuario && usuario.id === p.vendedor_id;

  const promedio = calificaciones.length
    ? (calificaciones.reduce((acc, c) => acc + c.puntuacion, 0) / calificaciones.length).toFixed(1)
    : null;

  contenedor.innerHTML = `
    <div class="detalle-portada-contenedor">
      <img src="${window.RiwiApp.api.obtenerImagenUrl(p.url_imagen, p.categoria)}" alt="${p.titulo}" class="detalle-portada-img">
    </div>

    <span class="badge" style="background:var(--color-accent-light);color:var(--color-accent-dark)">${p.categoria}</span>
    <h2 style="margin:10px 0 2px">${p.titulo}</h2>
    <p class="subtitle" style="margin-bottom:16px">Vendido por ${p.vendedor}</p>

    <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px">
      <span style="font-size:24px;font-weight:600">${window.RiwiApp.api.formatoMoneda(p.precio)}</span>
      ${promedio ? `<span>⭐ ${promedio} (${calificaciones.length} calificaciones)</span>` : `<span style="color:var(--color-text-muted)">Sin calificaciones aún</span>`}
    </div>

    <div id="producto-mensaje-error" class="mensaje-error"></div>
    <div id="producto-mensaje-exito" class="mensaje-exito"></div>

    <div id="producto-zona-accion" style="margin-bottom:24px"></div>

    <div style="border-top:1px solid var(--color-border);padding-top:16px;margin-bottom:16px">
      <h3 style="margin:0 0 6px">Descripción</h3>
      <p style="color:var(--color-text-muted);line-height:1.6">${p.descripcion}</p>
    </div>

    <div style="border-top:1px solid var(--color-border);padding-top:16px">
      <h3 style="margin:0 0 10px">Calificaciones</h3>
      <div id="producto-lista-calificaciones"></div>
    </div>
  `;

  renderCalificaciones(calificaciones);
  renderZonaAccion(p, usuario, esDueno);
}

function renderCalificaciones(calificaciones) {
  const lista = document.getElementById("producto-lista-calificaciones");
  if (!calificaciones.length) {
    lista.innerHTML = `<p class="vacio">Este producto todavía no tiene calificaciones.</p>`;
    return;
  }
  lista.innerHTML = calificaciones.map((c) => `
    <div class="lista-item" style="display:block">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <strong style="font-size:13px">${c.comprador}</strong>
        <span style="font-size:12px;color:var(--color-text-muted)">⭐ ${c.puntuacion}</span>
      </div>
      ${c.comentario ? `<p style="font-size:13px;color:var(--color-text-muted);margin:0">${c.comentario}</p>` : ""}
    </div>
  `).join("");
}

function renderZonaAccion(producto, usuario, esDueno) {
  const zona = document.getElementById("producto-zona-accion");
  zona.innerHTML = "";

  if (esDueno) {
    zona.innerHTML = producto.estado === "vendido"
      ? `<p class="subtitle">Este producto ya fue vendido y ya no aparece en el catálogo.</p>`
      : `<p class="subtitle">Este es tu propio producto.</p>`;
    return;
  }

  if (producto.estado !== "publicado") {
    zona.innerHTML = `<p class="subtitle">Este producto ya no está disponible (fue vendido).</p>`;
    return;
  }

  if (!usuario) {
    zona.innerHTML = `<a href="#/login"><button>Inicia sesión para comprar</button></a>`;
    return;
  }

  const enCarrito = window.RiwiApp?.carrito?.estaEnCarrito?.(producto.id);

  if (enCarrito) {
    zona.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center">
        <a href="#/carrito"><button class="secundario">Ver en el carrito</button></a>
      </div>
    `;
    return;
  }

  const btn = document.createElement("button");
  btn.textContent = "Agregar al carrito";
  btn.addEventListener("click", async () => {
    const agregado = await window.RiwiApp?.carrito?.agregar?.({
      id: producto.id,
      titulo: producto.titulo,
      precio: producto.precio,
      categoria: producto.categoria,
      vendedor: producto.vendedor,
    });
    if (agregado) {
      renderZonaAccion(producto, usuario, esDueno);
    }
  });
  zona.appendChild(btn);
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.producto = initProducto;
