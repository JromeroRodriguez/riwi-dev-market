const express = require("express");
const router = express.Router();
const productoModel = require("../models/producto");
const notificacionModel = require("../models/notificacion");
const { requiereRol } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed" || file.originalname.toLowerCase().endsWith(".zip")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos .zip"), false);
  }
};

const upload = multer({ storage, fileFilter });

router.get("/", async (req, res) => {
  try {
    const { categoria_id, precio_max, q } = req.query;
    const productos = await productoModel.listar_publicados(
      categoria_id || null,
      precio_max ? parseFloat(precio_max) : null,
      q || null
    );
    return res.json({ productos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/pendientes", requiereRol("administrador"), async (req, res) => {
  try {
    const productos = await productoModel.listar_pendientes();
    return res.json({ productos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/mios", requiereRol("vendedor", "administrador"), async (req, res) => {
  try {
    const productos = await productoModel.listar_por_vendedor(req.usuario.id);
    return res.json({ productos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:producto_id", async (req, res) => {
  try {
    const producto = await productoModel.obtener_por_id(req.params.producto_id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    return res.json({ producto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", requiereRol("vendedor", "administrador"), upload.single("archivo_zip"), async (req, res) => {
  try {
    const { titulo, descripcion, categoria_id, precio } = req.body || {};
    let { url_repositorio } = req.body || {};

    const campos_obligatorios = ["titulo", "descripcion", "categoria_id", "precio"];
    const faltantes = campos_obligatorios.filter((c) => !req.body[c] && req.body[c] !== 0);

    if (faltantes.length) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ error: `Campos obligatorios faltantes: ${faltantes.join(", ")}` });
    }
    if (parseFloat(precio) < 0) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ error: "El precio no puede ser negativo" });
    }

    if (req.file) {
      url_repositorio = `/uploads/${req.file.filename}`;
    } else {
      if (!url_repositorio || !url_repositorio.trim()) {
        return res.status(400).json({ error: "Debe proporcionar un enlace de repositorio de GitHub o subir un archivo .zip" });
      }
    }

    const producto = await productoModel.crear_producto(
      req.usuario.id, categoria_id, titulo.trim(), descripcion.trim(), precio, url_repositorio.trim()
    );
    return res.status(201).json({ mensaje: "Producto creado, pendiente de revisión", producto });
  } catch (err) {
    console.error(err);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.put("/:producto_id", requiereRol("vendedor", "administrador"), upload.single("archivo_zip"), async (req, res) => {
  try {
    if (!(await productoModel.es_propietario(req.params.producto_id, req.usuario.id))) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(403).json({ error: "No tienes permiso para editar este producto" });
    }

    const campos = { ...req.body };
    if (req.file) {
      campos.url_repositorio = `/uploads/${req.file.filename}`;
    }

    const producto = await productoModel.actualizar_producto(req.params.producto_id, req.usuario.id, campos);
    if (!producto) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ error: "No se enviaron campos válidos para actualizar o el producto no existe" });
    }
    return res.json({ mensaje: "Producto actualizado, pendiente de nueva revisión", producto });
  } catch (err) {
    console.error(err);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.delete("/:producto_id", requiereRol("vendedor", "administrador"), async (req, res) => {
  try {
    if (!(await productoModel.es_propietario(req.params.producto_id, req.usuario.id))) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este producto" });
    }
    const resultado = await productoModel.eliminar_producto(req.params.producto_id, req.usuario.id);
    return res.json({ mensaje: `Producto ${resultado.accion} correctamente` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:producto_id/aprobar", requiereRol("administrador"), async (req, res) => {
  try {
    const producto = await productoModel.aprobar_producto(req.params.producto_id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado o no está en revisión" });
    await notificacionModel.crear_notificacion(
      producto.vendedor_id,
      `Tu producto '${producto.titulo}' fue aprobado y ya está publicado.`
    );
    return res.json({ mensaje: "Producto aprobado", producto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:producto_id/rechazar", requiereRol("administrador"), async (req, res) => {
  try {
    const motivo = (req.body.motivo || "").trim();
    if (!motivo) return res.status(400).json({ error: "Debes indicar un motivo de rechazo" });
    const producto = await productoModel.rechazar_producto(req.params.producto_id, motivo);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado o no está en revisión" });
    await notificacionModel.crear_notificacion(
      producto.vendedor_id,
      `Tu producto '${producto.titulo}' fue rechazado. Motivo: ${motivo}`
    );
    return res.json({ mensaje: "Producto rechazado", producto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
