const express = require("express");
const router = express.Router();
const compraModel = require("../models/compra");
const productoModel = require("../models/producto");
const notificacionModel = require("../models/notificacion");
const { requiereRol } = require("../middleware/auth");

router.post("/", requiereRol(), async (req, res) => {
  try {
    const { producto_id } = req.body || {};
    if (!producto_id) return res.status(400).json({ error: "producto_id es obligatorio" });

    const producto = await compraModel.obtener_producto_publicado(producto_id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    if (producto.vendedor_id === req.usuario.id) {
      return res.status(400).json({ error: "No puedes comprar tu propio producto" });
    }

    const marcado = await productoModel.marcar_vendido(producto_id);
    if (!marcado) return res.status(409).json({ error: "Este producto ya no está disponible" });

    const compra = await compraModel.crear_compra(req.usuario.id, producto_id, producto.precio);

    await notificacionModel.crear_notificacion(
      producto.vendedor_id,
      "¡Has realizado una nueva venta! Revisa tu panel para más detalles."
    );

    return res.status(201).json({ mensaje: "Compra realizada con éxito", compra });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/mias", requiereRol(), async (req, res) => {
  try {
    const compras = await compraModel.listar_por_comprador(req.usuario.id);
    return res.json({ compras });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:compra_id/acceso", requiereRol(), async (req, res) => {
  try {
    const compra = await compraModel.obtener_compra_propia(req.params.compra_id, req.usuario.id);
    if (!compra) return res.status(404).json({ error: "Compra no encontrada o no te pertenece" });
    return res.json({
      producto: compra.titulo,
      url_repositorio: compra.url_repositorio,
      fecha_compra: compra.fecha_compra,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
