const pool = require("../db/connection");

async function crear_producto(vendedor_id, categoria_id, titulo, descripcion, precio, url_repositorio) {
  const { rows } = await pool.query(
    `INSERT INTO productos (vendedor_id, categoria_id, titulo, descripcion, precio, url_repositorio, estado)
     VALUES ($1, $2, $3, $4, $5, $6, 'en_revision')
     RETURNING id, vendedor_id, categoria_id, titulo, descripcion, precio, url_repositorio, estado, fecha_creacion`,
    [vendedor_id, categoria_id, titulo, descripcion, precio, url_repositorio]
  );
  return rows[0];
}

async function listar_publicados(categoria_id = null, precio_max = null, busqueda = null) {
  const condiciones = ["p.estado = 'publicado'"];
  const valores = [];
  let idx = 1;

  if (categoria_id) {
    condiciones.push(`p.categoria_id = $${idx++}`);
    valores.push(categoria_id);
  }
  if (precio_max !== null) {
    condiciones.push(`p.precio <= $${idx++}`);
    valores.push(precio_max);
  }
  if (busqueda) {
    condiciones.push(`(p.titulo ILIKE $${idx} OR p.descripcion ILIKE $${idx})`);
    valores.push(`%${busqueda}%`);
    idx++;
  }

  const where = condiciones.join(" AND ");
  const { rows } = await pool.query(
    `SELECT p.id, p.titulo, p.descripcion, p.precio, p.url_repositorio,
            p.fecha_creacion, c.nombre AS categoria, u.nombre AS vendedor,
            COALESCE(AVG(cal.puntuacion), 0) AS calificacion_promedio,
            COUNT(cal.id) AS total_calificaciones
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     JOIN usuarios u ON u.id = p.vendedor_id
     LEFT JOIN compras co ON co.producto_id = p.id
     LEFT JOIN calificaciones cal ON cal.compra_id = co.id
     WHERE ${where}
     GROUP BY p.id, c.nombre, u.nombre
     ORDER BY p.fecha_creacion DESC`,
    valores
  );
  return rows;
}

async function obtener_por_id(producto_id) {
  const { rows } = await pool.query(
    `SELECT p.*, c.nombre AS categoria, u.nombre AS vendedor
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     JOIN usuarios u ON u.id = p.vendedor_id
     WHERE p.id = $1`,
    [producto_id]
  );
  return rows[0] || null;
}

async function listar_por_vendedor(vendedor_id) {
  const { rows } = await pool.query(
    `SELECT p.*, c.nombre AS categoria
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     WHERE p.vendedor_id = $1
     ORDER BY p.fecha_creacion DESC`,
    [vendedor_id]
  );
  return rows;
}

async function listar_pendientes() {
  const { rows } = await pool.query(
    `SELECT p.*, c.nombre AS categoria, u.nombre AS vendedor
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     JOIN usuarios u ON u.id = p.vendedor_id
     WHERE p.estado = 'en_revision'
     ORDER BY p.fecha_creacion ASC`
  );
  return rows;
}

async function actualizar_producto(producto_id, vendedor_id, campos) {
  const columnas_permitidas = new Set(["titulo", "descripcion", "precio", "url_repositorio", "categoria_id"]);
  const actualizaciones = [];
  const valores = [];
  let idx = 1;

  for (const [k, v] of Object.entries(campos)) {
    if (columnas_permitidas.has(k)) {
      actualizaciones.push(`${k} = $${idx++}`);
      valores.push(v);
    }
  }

  if (!actualizaciones.length) return null;

  valores.push(producto_id, vendedor_id);
  const { rows } = await pool.query(
    `UPDATE productos
     SET ${actualizaciones.join(", ")}, estado = 'en_revision'
     WHERE id = $${idx++} AND vendedor_id = $${idx}
     RETURNING id, titulo, descripcion, precio, url_repositorio, estado`,
    valores
  );
  return rows[0] || null;
}

async function eliminar_producto(producto_id, vendedor_id) {
  const { rows: countRows } = await pool.query(
    "SELECT COUNT(*) AS total FROM compras WHERE producto_id = $1",
    [producto_id]
  );
  const tiene_compras = parseInt(countRows[0].total) > 0;

  if (tiene_compras) {
    const { rows } = await pool.query(
      `UPDATE productos SET estado = 'archivado'
       WHERE id = $1 AND vendedor_id = $2
       RETURNING id`,
      [producto_id, vendedor_id]
    );
    return { accion: "archivado", producto: rows[0] || null };
  }

  const { rows } = await pool.query(
    "DELETE FROM productos WHERE id = $1 AND vendedor_id = $2 RETURNING id",
    [producto_id, vendedor_id]
  );
  return { accion: "eliminado", producto: rows[0] || null };
}

async function es_propietario(producto_id, vendedor_id) {
  const { rows } = await pool.query(
    "SELECT 1 FROM productos WHERE id = $1 AND vendedor_id = $2",
    [producto_id, vendedor_id]
  );
  return rows.length > 0;
}

async function marcar_vendido(producto_id) {
  const { rows } = await pool.query(
    `UPDATE productos SET estado = 'vendido'
     WHERE id = $1 AND estado = 'publicado'
     RETURNING id, titulo, estado`,
    [producto_id]
  );
  return rows[0] || null;
}

async function aprobar_producto(producto_id) {
  const { rows } = await pool.query(
    `UPDATE productos SET estado = 'publicado', motivo_rechazo = NULL
     WHERE id = $1 AND estado = 'en_revision'
     RETURNING id, titulo, estado, vendedor_id`,
    [producto_id]
  );
  return rows[0] || null;
}

async function rechazar_producto(producto_id, motivo) {
  const { rows } = await pool.query(
    `UPDATE productos SET estado = 'rechazado', motivo_rechazo = $1
     WHERE id = $2 AND estado = 'en_revision'
     RETURNING id, titulo, estado, vendedor_id`,
    [motivo, producto_id]
  );
  return rows[0] || null;
}

module.exports = {
  crear_producto,
  listar_publicados,
  obtener_por_id,
  listar_por_vendedor,
  listar_pendientes,
  actualizar_producto,
  eliminar_producto,
  es_propietario,
  marcar_vendido,
  aprobar_producto,
  rechazar_producto,
};
