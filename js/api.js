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

    async apiFetch(endpoint, { method = "GET", body = null, auth = false } = {}) {
      const headers = { "Content-Type": "application/json" };

      if (auth) {
        const token = this.obtenerToken();
        if (!token) {
          this.navegarA("login");
          throw new Error("Debes iniciar sesión para continuar");
        }
        headers["Authorization"] = `Bearer ${token}`;
      }

      const opciones = { method, headers };
      if (body) opciones.body = JSON.stringify(body);

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
        contenedor.innerHTML = `<a href="#/login">Iniciar sesión</a> <a href="#/registro" class="navbar-cta">Registrarse</a>`;
        return;
      }

      let enlaces = `<a href="#/catalogo">Catálogo</a> <a href="#/mis-compras">Mis compras</a> <a href="#/perfil">Mi perfil</a>`;

      if (usuario.rol === "vendedor" || usuario.rol === "administrador") {
        enlaces += ` <a href="#/dashboard-vendedor">Vender</a>`;
      }
      if (usuario.rol === "administrador") {
        enlaces += ` <a href="#/dashboard-admin">Administración</a>`;
      }

      enlaces += `
        <span class="navbar-user">
          <span class="navbar-avatar">${this.iniciales(usuario.nombre)}</span>
          <span class="navbar-nombre">${usuario.nombre.split(" ")[0]}</span>
          <a href="#" class="navbar-logout" id="btn-logout-${contenedorId}">Salir</a>
        </span>
      `;
      contenedor.innerHTML = enlaces;

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
})();
