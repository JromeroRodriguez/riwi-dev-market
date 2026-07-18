(function () {
  const app = (window.RiwiApp = window.RiwiApp || {});

  const api = {
    API_BASE_URL: "http://localhost:5000/api",

    obtenerToken() {
      return localStorage.getItem("token");
    },

    obtenerUsuario() {
      const data = localStorage.getItem("usuario");
      return data ? JSON.parse(data) : null;
    },

    guardarSesion(token, usuario) {
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
    },

    cerrarSesion() {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      if (window.RiwiApp?.carrito?.actualizarBadge) {
        window.RiwiApp.carrito.actualizarBadge();
      }
      window.location.hash = "#/";
    },

    navegarA(ruta) {
      const router = app.router;
      if (router && typeof router.navegarA === "function") {
        router.navegarA(ruta);
        return;
      }
      window.location.hash = `#/${ruta}`;
    },

    async apiFetch(endpoint, { method = "GET", body = null, auth = false, authOptional = false } = {}) {
      const headers = {};
      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      if (auth) {
        const token = this.obtenerToken();
        if (!token) {
          this.navegarA("login");
          throw new Error("Debes iniciar sesión para continuar");
        }
        headers["Authorization"] = `Bearer ${token}`;
      } else if (authOptional) {
        const token = this.obtenerToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const opciones = { method, headers };
      if (body) {
        opciones.body = body instanceof FormData ? body : JSON.stringify(body);
      }

      const respuesta = await fetch(`${this.API_BASE_URL}${endpoint}`, opciones);
      const datos = await respuesta.json().catch(() => ({}));

      if (respuesta.status === 401) {
        if (auth) {
          this.cerrarSesion();
          throw new Error("Tu sesión expiró. Por favor inicia sesión de nuevo.");
        }
        throw new Error(datos.error || "Credenciales incorrectas");
      }

      if (!respuesta.ok) {
        throw new Error(datos.error || "Ocurrió un error al comunicarse con el servidor");
      }

      return datos;
    },

    protegerPagina(rolesPermitidos = []) {
      const usuario = this.obtenerUsuario();
      if (!usuario || !this.obtenerToken()) {
        this.navegarA("login");
        return null;
      }
      if (rolesPermitidos.length && !rolesPermitidos.includes(usuario.rol)) {
        if (typeof alertaError === "function") {
          alertaError("No tienes permisos para acceder a esta página", "Acceso denegado");
        }
        this.navegarA("catalogo");
        return null;
      }
      return usuario;
    },

    mostrarError(mensaje, contenedorId = "mensaje-error") {
      const el = document.getElementById(contenedorId);
      if (el) {
        el.textContent = mensaje;
        el.style.display = "block";
      } else if (typeof alertaError === "function") {
        alertaError(mensaje);
      }
    },

    formatoMoneda(valor) {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);
    },

    obtenerImagenUrl(url_imagen, categoria) {
      if (url_imagen) {
        if (url_imagen.startsWith("/")) {
          return `http://localhost:5000${url_imagen}`;
        }
        return url_imagen;
      }

      const defaults = {
        "Apps web": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%' height='100%'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%236366f1'/><stop offset='100%' stop-color='%23a855f7'/></linearGradient></defs><rect width='400' height='300' fill='url(%23g1)'/><rect x='40' y='50' width='320' height='200' rx='10' fill='%23ffffff' fill-opacity='0.15' stroke='%23ffffff' stroke-width='2'/><circle cx='60' cy='70' r='5' fill='%23ffffff'/><circle cx='75' cy='70' r='5' fill='%23ffffff'/><circle cx='90' cy='70' r='5' fill='%23ffffff'/><line x1='40' y1='90' x2='360' y2='90' stroke='%23ffffff' stroke-width='1.5'/><rect x='80' y='120' width='240' height='12' rx='4' fill='%23ffffff' fill-opacity='0.8'/><rect x='80' y='145' width='180' height='8' rx='4' fill='%23ffffff' fill-opacity='0.6'/><rect x='80' y='165' width='210' height='8' rx='4' fill='%23ffffff' fill-opacity='0.6'/><rect x='150' y='195' width='100' height='30' rx='6' fill='%23ffffff' fill-opacity='0.9'/></svg>",
        "APIs": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%' height='100%'><defs><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2310b981'/><stop offset='100%' stop-color='%233b82f6'/></linearGradient></defs><rect width='400' height='300' fill='url(%23g2)'/><path d='M140 150h120M200 90v120M120 120a20 20 0 0 1 20-20h120a20 20 0 0 1 20 20v60a20 20 0 0 1-20 20H140a20 20 0 0 1-20-20z' fill='none' stroke='%23ffffff' stroke-width='3' stroke-dasharray='6 4'/><rect x='160' y='130' width='80' height='40' rx='8' fill='%23ffffff' fill-opacity='0.2' stroke='%23ffffff' stroke-width='2'/><text x='200' y='155' font-family='sans-serif' font-size='16' font-weight='bold' fill='%23ffffff' text-anchor='middle'>JSON</text></svg>",
        "Plantillas": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%' height='100%'><defs><linearGradient id='g3' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f59e0b'/><stop offset='100%' stop-color='%23ef4444'/></linearGradient></defs><rect width='400' height='300' fill='url(%23g3)'/><rect x='50' y='40' width='300' height='220' rx='8' fill='none' stroke='%23ffffff' stroke-width='2' stroke-dasharray='4 4'/><rect x='70' y='60' width='260' height='50' rx='4' fill='%23ffffff' fill-opacity='0.2' stroke='%23ffffff' stroke-width='1.5'/><rect x='70' y='125' width='120' height='115' rx='4' fill='%23ffffff' fill-opacity='0.15' stroke='%23ffffff' stroke-width='1.5'/><rect x='210' y='125' width='120' height='115' rx='4' fill='%23ffffff' fill-opacity='0.15' stroke='%23ffffff' stroke-width='1.5'/></svg>",
        "Automatizaciones": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%' height='100%'><defs><linearGradient id='g4' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23ec4899'/><stop offset='100%' stop-color='%238b5cf6'/></linearGradient></defs><rect width='400' height='300' fill='url(%23g4)'/><path d='M200 70 L260 130 L220 130 L220 200 L180 200 L180 130 L140 130 Z' fill='%23ffffff' fill-opacity='0.2'/><circle cx='200' cy='150' r='50' fill='none' stroke='%23ffffff' stroke-width='3'/><path d='M200 80 a 70 70 0 0 1 70 70' fill='none' stroke='%23ffffff' stroke-width='3' stroke-linecap='round'/><circle cx='200' cy='150' r='10' fill='%23ffffff'/><circle cx='130' cy='100' r='15' fill='%23ffffff' fill-opacity='0.3'/><circle cx='280' cy='200' r='20' fill='%23ffffff' fill-opacity='0.2'/></svg>"
      };

      return defaults[categoria] || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%' height='100%'><defs><linearGradient id='g5' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%236b7280'/><stop offset='100%' stop-color='%239ca3af'/></linearGradient></defs><rect width='400' height='300' fill='url(%23g5)'/><circle cx='200' cy='150' r='40' fill='%23ffffff' fill-opacity='0.2'/></svg>";
    },

    iniciales(nombre) {
      return nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("");
    },

    renderNavbar(contenedorId) {
      const contenedor = document.getElementById(contenedorId);
      if (!contenedor) return;

      const usuario = this.obtenerUsuario();

      if (!usuario) {
        contenedor.innerHTML = `
          <div class="navbar-links">
            <a href="#/catalogo">Catálogo</a>
          </div>
          <div class="navbar-actions">
            <a href="#/login" class="btn-navbar-outline">Iniciar sesión</a>
            <a href="#/registro" class="btn-navbar-cta">Registrarse</a>
          </div>
        `;
        return;
      }

      const rolLabel = { administrador: "Admin", vendedor: "Vendedor", comprador: "Comprador" };

      let links = `<a href="#/catalogo">Catálogo</a>`;
      links += `<a href="#/mis-compras">Mis compras</a>`;

      if (usuario.rol === "vendedor" || usuario.rol === "administrador") {
        links += `<a href="#/dashboard-vendedor">Vender</a>`;
      }
      if (usuario.rol === "administrador") {
        links += `<a href="#/dashboard-admin">Admin</a>`;
      }

      const cantidad = window.RiwiApp?.carrito?.cantidad?.() || 0;

      contenedor.innerHTML = `
        <div class="navbar-links">
          ${links}
        </div>
        <div class="navbar-actions">
          <a href="#/carrito" class="navbar-carrito">
            🛒<span class="carrito-badge" style="display:${cantidad > 0 ? "flex" : "none"}">${cantidad}</span>
          </a>
          <div class="navbar-perfil" id="navbar-perfil-${contenedorId}">
            <button class="navbar-perfil-btn" id="navbar-perfil-btn-${contenedorId}">
              <span class="navbar-avatar">${this.iniciales(usuario.nombre)}</span>
              <span class="navbar-nombre">${usuario.nombre.split(" ")[0]}</span>
              <span class="navbar-chevron">▾</span>
            </button>
            <div class="navbar-dropdown" id="navbar-dropdown-${contenedorId}">
              <div class="navbar-dropdown-header">
                <span class="navbar-avatar navbar-avatar-lg">${this.iniciales(usuario.nombre)}</span>
                <div>
                  <div class="navbar-dropdown-name">${usuario.nombre}</div>
                  <div class="navbar-dropdown-rol">${rolLabel[usuario.rol] || usuario.rol}</div>
                </div>
              </div>
              <div class="navbar-dropdown-divider"></div>
              <a href="#/perfil" class="navbar-dropdown-item">👤 Mi perfil</a>
              <div class="navbar-dropdown-divider"></div>
              <button class="navbar-dropdown-item navbar-dropdown-item--danger" id="btn-logout-${contenedorId}">🚪 Cerrar sesión</button>
            </div>
          </div>
        </div>
      `;

      const perfilBtn = document.getElementById(`navbar-perfil-btn-${contenedorId}`);
      const dropdown = document.getElementById(`navbar-dropdown-${contenedorId}`);

      perfilBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
      });

      document.addEventListener("click", () => {
        dropdown.classList.remove("open");
      });

      dropdown.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      const logoutButton = document.getElementById(`btn-logout-${contenedorId}`);
      if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
          e.preventDefault();
          this.cerrarSesion();
        });
      }
    },
  };

  app.api = api;
  window.apiFetch = api.apiFetch.bind(api);
  window.protegerPagina = api.protegerPagina.bind(api);
  window.mostrarError = api.mostrarError.bind(api);
  window.formatoMoneda = api.formatoMoneda.bind(api);
  window.iniciales = api.iniciales.bind(api);
  window.obtenerToken = api.obtenerToken.bind(api);
  window.obtenerUsuario = api.obtenerUsuario.bind(api);
  window.guardarSesion = api.guardarSesion.bind(api);
  window.cerrarSesion = api.cerrarSesion.bind(api);
  window.renderNavbar = api.renderNavbar.bind(api);
  window.navegarA = api.navegarA.bind(api);
  window.obtenerImagenUrl = api.obtenerImagenUrl.bind(api);
})();
