require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db/connection");
const bcrypt = require("bcrypt");

const authRoutes = require("./routes/auth");
const usuarioRoutes = require("./routes/usuario");
const categoriaRoutes = require("./routes/categoria");
const productoRoutes = require("./routes/producto");
const compraRoutes = require("./routes/compra");
const calificacionRoutes = require("./routes/calificacion");
const notificacionRoutes = require("./routes/notificacion");
const estadisticaRoutes = require("./routes/estadistica");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/compras", compraRoutes);
app.use("/api", calificacionRoutes);
app.use("/api/notificaciones", notificacionRoutes);
app.use("/api/estadisticas", estadisticaRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", servicio: "marketplace-riwi-api" });
});

async function seedAdmin() {
  try {
    const { rows } = await pool.query("SELECT id, password_hash FROM usuarios WHERE email = $1", ["admin@riwi.io"]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await pool.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol, estado)
         VALUES ($1, $2, $3, $4, $5)`,
        ["Admin RIWI", "admin@riwi.io", hash, "administrador", "activo"]
      );
      console.log("Usuario administrador creado: admin@riwi.io / admin123");
    } else {
      const valid = await bcrypt.compare("admin123", rows[0].password_hash);
      if (!valid) {
        const hash = await bcrypt.hash("admin123", 10);
        await pool.query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [hash, rows[0].id]);
        console.log("Password del admin corregido: admin@riwi.io / admin123");
      }
    }
  } catch (err) {
    console.error("Error al sembrar admin:", err.message);
  }
}

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("Conectado a PostgreSQL");
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error al iniciar:", err.message);
    process.exit(1);
  }
}

start();
