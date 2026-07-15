const express = require("express");
const router = express.Router();
const estadisticaModel = require("../models/estadistica");
const { requiereRol } = require("../middleware/auth");

router.get("/vendedor", requiereRol("vendedor", "administrador"), async (req, res) => {
  try {
    const resumen = await estadisticaModel.estadisticas_vendedor(req.usuario.id);
    const top_producto = await estadisticaModel.producto_mas_vendido(req.usuario.id);
    return res.json({ resumen, producto_mas_vendido: top_producto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/admin", requiereRol("administrador"), async (req, res) => {
  try {
    const resumen = await estadisticaModel.estadisticas_admin();
    return res.json({ resumen });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
