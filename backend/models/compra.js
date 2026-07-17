const pool = require("../db/connection");

async function obtener_producto_publicado(producto_id) {
  const { rows } = await pool.query(
    "SELECT id, vendedor_id, precio, estado FROM productos WHERE id = $1",
    [producto_id]
  );
  return rows[0] || null;
}

async function ya_comprado(comprador_id, producto_id) {
  const { rows } = await pool.query(
    `SELECT 1 FROM compras
     WHERE comprador_id = $1 AND producto_id = $2 AND estado_pago = 'completado'`,
    [comprador_id, producto_id]
  );
  return rows.length > 0;
}

async function crear_compra(comprador_id, producto_id, monto) {
  const { rows } = await pool.query(
    `INSERT INTO compras (comprador_id, producto_id, monto, estado_pago)
     VALUES ($1, $2, $3, 'completado')
     RETURNING id, comprador_id, producto_id, monto, estado_pago, fecha_compra`,
    [comprador_id, producto_id, monto]
  );
  return rows[0];
}

async function listar_por_comprador(comprador_id) {
  const { rows } = await pool.query(
    `SELECT co.id, co.monto, co.estado_pago, co.fecha_compra,
            p.id AS producto_id, p.titulo, p.descripcion,
            c.nombre AS categoria, u.nombre AS vendedor
     FROM compras co
     JOIN productos p ON p.id = co.producto_id
     JOIN categorias c ON c.id = p.categoria_id
     JOIN usuarios u ON u.id = p.vendedor_id
     WHERE co.comprador_id = $1
     ORDER BY co.fecha_compra DESC`,
    [comprador_id]
  );
  return rows;
}

async function obtener_compra_propia(compra_id, comprador_id) {
  const { rows } = await pool.query(
    `SELECT co.id, co.fecha_compra, p.titulo, p.url_repositorio
     FROM compras co
     JOIN productos p ON p.id = co.producto_id
     WHERE co.id = $1 AND co.comprador_id = $2 AND co.estado_pago = 'completado'`,
    [compra_id, comprador_id]
  );
  return rows[0] || null;
}

async function ventas_por_vendedor(vendedor_id) {
  const { rows } = await pool.query(
    `SELECT COUNT(co.id) AS total_ventas, COALESCE(SUM(co.monto), 0) AS ingresos_totales
     FROM compras co
     JOIN productos p ON p.id = co.producto_id
     WHERE p.vendedor_id = $1 AND co.estado_pago = 'completado'`,
    [vendedor_id]
  );
  return rows[0];
}

module.exports = {
  obtener_producto_publicado,
  ya_comprado,
  crear_compra,
  listar_por_comprador,
  obtener_compra_propia,
  ventas_por_vendedor,
};
