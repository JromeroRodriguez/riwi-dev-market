function initLogin() {
  const formLogin = document.getElementById("login-form");
  if (!formLogin || formLogin.dataset.bound === "true") return;

  formLogin.dataset.bound = "true";
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    alertaCargando("Iniciando sesión...");

    try {
      const data = await window.RiwiApp.api.apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      window.RiwiApp.api.guardarSesion(data.token, data.usuario);
      await window.RiwiApp.carrito?.cargar();

      await Swal.fire({
        icon: "success",
        title: `¡Bienvenido, ${data.usuario.nombre.split(" ")[0]}!`,
        customClass: { popup: "swal-riwi" },
        timer: 1200,
        showConfirmButton: false,
      });

      window.RiwiApp.router.navegarA("catalogo");
    } catch (err) {
      alertaError(err.message, "No se pudo iniciar sesión");
    }
  });
}

function initRegistro() {
  const formRegistro = document.getElementById("registro-form");
  if (!formRegistro || formRegistro.dataset.bound === "true") return;

  formRegistro.dataset.bound = "true";
  formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("registro-nombre").value.trim();
    const email = document.getElementById("registro-email").value.trim();
    const password = document.getElementById("registro-password").value;

    alertaCargando("Creando tu cuenta...");

    try {
      await window.RiwiApp.api.apiFetch("/auth/registro", {
        method: "POST",
        body: { nombre, email, password },
      });

      await Swal.fire({
        icon: "success",
        title: "Cuenta creada con éxito",
        text: "Ahora inicia sesión para continuar.",
        customClass: { popup: "swal-riwi" },
        confirmButtonColor: SWAL_COLOR_CONFIRMAR,
      });

      window.RiwiApp.router.navegarA("login");
    } catch (err) {
      alertaError(err.message, "No se pudo crear la cuenta");
    }
  });
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.login = initLogin;
window.RiwiApp.views.registro = initRegistro;

initLogin();
initRegistro();
