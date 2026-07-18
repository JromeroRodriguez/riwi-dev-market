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
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const { rows: productoRows } = await cliente.query(
      `SELECT id, estado
       FROM productos
       WHERE id = $1
       FOR UPDATE`,
      [producto_id]
    );

    if (productoRows.length === 0 || productoRows[0].estado !== "publicado") {
      await cliente.query("ROLLBACK");
      return null;
    }

    const { rows } = await cliente.query(
      `INSERT INTO compras (comprador_id, producto_id, monto, estado_pago)
       VALUES ($1, $2, $3, 'completado')
       RETURNING id, comprador_id, producto_id, monto, estado_pago, fecha_compra`,
      [comprador_id, producto_id, monto]
    );

    const { rows: productoActualizado } = await cliente.query(
      `UPDATE productos
       SET estado = 'vendido'
       WHERE id = $1 AND estado = 'publicado'
       RETURNING id`,
      [producto_id]
    );

    if (productoActualizado.length === 0) {
      await cliente.query("ROLLBACK");
      return null;
    }

    await cliente.query("COMMIT");
    return rows[0];
  } catch (err) {
    await cliente.query("ROLLBACK");
    throw err;
  } finally {
    cliente.release();
  }
}

async function listar_por_comprador(comprador_id) {
  const { rows } = await pool.query(
    `SELECT co.id, co.monto, co.estado_pago, co.fecha_compra,
            p.id AS producto_id, p.titulo, p.descripcion,
            c.nombre AS categoria, u.nombre AS vendedor,
            EXISTS (SELECT 1 FROM calificaciones cal WHERE cal.compra_id = co.id) AS ya_calificada
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

async function obtener_productos_para_lote(producto_ids) {
  const { rows } = await pool.query(
    `SELECT id, vendedor_id, precio, estado, titulo
     FROM productos WHERE id = ANY($1)`,
    [producto_ids]
  );
  return rows;
}

async function crear_compra_lote(comprador_id, compras) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");

    const resultados = [];
    for (const { producto_id, monto } of compras) {
      const { rows: existe } = await cliente.query(
        `SELECT 1 FROM productos WHERE id = $1 AND estado = 'publicado'`,
        [producto_id]
      );
      if (existe.length === 0) {
        await cliente.query("ROLLBACK");
        return { exito: false, producto_id };
      }

      const { rows } = await cliente.query(
        `INSERT INTO compras (comprador_id, producto_id, monto, estado_pago)
         VALUES ($1, $2, $3, 'completado')
         RETURNING id, producto_id, monto, estado_pago, fecha_compra`,
        [comprador_id, producto_id, monto]
      );
      resultados.push(rows[0]);

      await cliente.query(
        `UPDATE productos SET estado = 'vendido' WHERE id = $1 AND estado = 'publicado'`,
        [producto_id]
      );
    }

    await cliente.query("COMMIT");
    return { exito: true, compras: resultados };
  } catch (err) {
    await cliente.query("ROLLBACK");
    throw err;
  } finally {
    cliente.release();
  }
}

module.exports = {
  obtener_producto_publicado,
  ya_comprado,
  crear_compra,
  obtener_productos_para_lote,
  crear_compra_lote,
  listar_por_comprador,
  obtener_compra_propia,
  ventas_por_vendedor,
};
