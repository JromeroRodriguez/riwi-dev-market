function initPerfil() {
  const api = window.RiwiApp?.api;
  const usuarioActual = api?.protegerPagina();
  if (!usuarioActual) return;
  api?.renderNavbar("perfil-nav-links");
  cargarPerfil();
}

function etiquetaRolPerfil(rol) {
  const mapa = { administrador: "Administrador", vendedor: "Vendedor", comprador: "Comprador" };
  return mapa[rol] || rol;
}

async function cargarPerfil() {
  try {
    const data = await window.RiwiApp.api.apiFetch("/auth/perfil", { auth: true });
    const u = data.usuario;

    window.RiwiApp.api.guardarSesion(window.RiwiApp.api.obtenerToken(), u);

    document.getElementById("perfil-info-perfil").innerHTML = `
      <p style="margin:0 0 4px"><strong>${u.nombre}</strong></p>
      <p class="info-secundaria" style="margin:0 0 8px">${u.email}</p>
      <p class="info-secundaria">Rol: ${etiquetaRolPerfil(u.rol)}</p>
    `;

    renderZonaVendedor(u);
  } catch (err) {
    alertaError(err.message);
  }
}

function renderZonaVendedor(u) {
  const zona = document.getElementById("perfil-zona-vendedor");

  if (u.rol === "vendedor" || u.rol === "administrador") {
    zona.innerHTML = `<p class="subtitle">Ya tienes acceso para publicar productos. Ve a tu <a href="#/dashboard-vendedor" style="color:var(--color-accent)">panel de vendedor</a>.</p>`;
    return;
  }

  if (u.estado === "pendiente_vendedor") {
    zona.innerHTML = `<p class="subtitle">Tu solicitud para ser vendedor está pendiente de revisión por un administrador.</p>`;
    return;
  }

  zona.innerHTML = `
    <p class="subtitle">¿Quieres publicar y vender tus propios productos digitales?</p>
    <button id="btn-solicitar">Solicitar convertirme en vendedor</button>
  `;

  document.getElementById("btn-solicitar").addEventListener("click", solicitarVendedor);
}

async function solicitarVendedor() {
  const confirmado = await alertaConfirmar(
    "Un administrador revisará tu solicitud antes de darte acceso para publicar productos.",
    "¿Solicitar convertirte en vendedor?"
  );
  if (!confirmado) return;

  alertaCargando("Enviando solicitud...");

  try {
    await window.RiwiApp.api.apiFetch("/usuarios/solicitud-vendedor", { method: "POST", auth: true });
    await alertaExito("Un administrador la revisará pronto.", "Solicitud enviada");
    cargarPerfil();
  } catch (err) {
    alertaError(err.message);
  }
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.perfil = initPerfil;
