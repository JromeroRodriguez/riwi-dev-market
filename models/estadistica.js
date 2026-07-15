const pool = require("../db/connection");

async function estadisticas_vendedor(vendedor_id) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(DISTINCT p.id) AS productos_publicados,
       COUNT(DISTINCT co.id) AS total_ventas,
       COALESCE(SUM(co.monto), 0) AS ingresos_totales,
       COALESCE(AVG(cal.puntuacion), 0) AS calificacion_promedio
     FROM productos p
     LEFT JOIN compras co ON co.producto_id = p.id AND co.estado_pago = 'completado'
     LEFT JOIN calificaciones cal ON cal.compra_id = co.id
     WHERE p.vendedor_id = $1 AND p.estado != 'archivado'`,
    [vendedor_id]
  );
  return rows[0];
}

async function producto_mas_vendido(vendedor_id) {
  const { rows } = await pool.query(
    `SELECT p.titulo, COUNT(co.id) AS total_ventas
     FROM productos p
     JOIN compras co ON co.producto_id = p.id AND co.estado_pago = 'completado'
     WHERE p.vendedor_id = $1
     GROUP BY p.id, p.titulo
     ORDER BY total_ventas DESC
     LIMIT 1`,
    [vendedor_id]
  );
  return rows[0] || null;
}

async function estadisticas_admin() {
  const { rows: r1 } = await pool.query("SELECT COUNT(*) AS total FROM usuarios WHERE estado = 'activo'");
  const usuarios_activos = parseInt(r1[0].total);

  const { rows: r2 } = await pool.query("SELECT COUNT(*) AS total FROM productos WHERE estado = 'publicado'");
  const productos_publicados = parseInt(r2[0].total);

  const { rows: r3 } = await pool.query("SELECT COUNT(*) AS total FROM productos WHERE estado = 'en_revision'");
  const pendientes_revision = parseInt(r3[0].total);

  const { rows: r4 } = await pool.query(
    `SELECT COUNT(*) AS total_ventas, COALESCE(SUM(monto), 0) AS ingresos_totales
     FROM compras WHERE estado_pago = 'completado'`
  );

  const { rows: r5 } = await pool.query(
    `SELECT COUNT(*) AS total_ventas_mes, COALESCE(SUM(monto), 0) AS ingresos_mes
     FROM compras
     WHERE estado_pago = 'completado'
       AND date_trunc('month', fecha_compra) = date_trunc('month', CURRENT_DATE)`
  );

  return {
    usuarios_activos,
    productos_publicados,
    pendientes_revision,
    ventas_totales: parseInt(r4[0].total_ventas),
    ingresos_totales: parseFloat(r4[0].ingresos_totales),
    ventas_mes_actual: parseInt(r5[0].total_ventas_mes),
    ingresos_mes_actual: parseFloat(r5[0].ingresos_mes),
  };
}

module.exports = { estadisticas_vendedor, producto_mas_vendido, estadisticas_admin };
