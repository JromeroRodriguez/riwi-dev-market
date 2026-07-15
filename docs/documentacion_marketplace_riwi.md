# Documentación de Producto — Marketplace de Productos Digitales RIWI

## 1. Descripción general

Plataforma web que permite a los coders y egresados de RIWI publicar, promocionar y vender productos digitales (aplicaciones web, APIs, plantillas, automatizaciones) desarrollados durante su proceso de formación. Los compradores pueden explorar un catálogo, comprar, acceder al repositorio del producto y calificarlo.

**Stack tecnológico:**
- Backend: Python + Flask
- Frontend: HTML + CSS + JavaScript (vanilla)
- Base de datos: PostgreSQL / MySQL en Docker
- Herramienta de administración de BD: DBeaver
- Autenticación: JWT

## 2. Roles y permisos

| Acción | Administrador | Vendedor | Comprador |
|---|:---:|:---:|:---:|
| Registrarse / iniciar sesión | ✔ | ✔ | ✔ |
| Publicar producto | — | ✔ | — |
| Editar/eliminar su propio producto | — | ✔ | — |
| Aprobar / rechazar productos | ✔ | — | — |
| Ver catálogo público | ✔ | ✔ | ✔ |
| Comprar producto | — | ✔ (como comprador) | ✔ |
| Acceder a repositorio comprado | — | ✔ | ✔ |
| Calificar producto comprado | — | ✔ | ✔ |
| Ver historial de compras propio | — | ✔ | ✔ |
| Ver estadísticas propias de ventas | — | ✔ | — |
| Ver estadísticas globales | ✔ | — | — |
| Gestionar usuarios (activar/bloquear) | ✔ | — | — |
| Gestionar categorías | ✔ | — | — |

*Nota: un mismo usuario puede tener rol vendedor y también comprar productos de otros; el rol "comprador" no es exclusivo.*

## 3. Product Backlog — Historias de Usuario

### Epic 1: Autenticación y gestión de usuarios

**HU-01** | Prioridad: Alta
Como visitante, quiero registrarme con nombre, correo y contraseña, para poder acceder a la plataforma con un rol inicial de comprador.
- Criterios de aceptación:
  - El correo debe ser único.
  - La contraseña se almacena cifrada (hash).
  - Se envía confirmación de registro exitoso.

**HU-02** | Prioridad: Alta
Como usuario registrado, quiero iniciar sesión con correo y contraseña, para acceder a mi panel según mi rol.
- Criterios de aceptación:
  - Se genera un token JWT válido al autenticarse.
  - Si las credenciales son incorrectas, se muestra un mensaje de error claro.

**HU-03** | Prioridad: Media
Como comprador, quiero solicitar convertirme en vendedor, para poder publicar mis propios productos.
- Criterios de aceptación:
  - La solicitud queda en estado "pendiente" hasta aprobación del administrador.

**HU-04** | Prioridad: Media
Como administrador, quiero ver la lista de usuarios registrados y su estado, para poder activarlos o bloquearlos si es necesario.
- Criterios de aceptación:
  - Puedo filtrar por rol y estado.
  - Puedo cambiar el estado de un usuario (activo/bloqueado).

### Epic 2: Gestión de productos (Vendedor)

**HU-05** | Prioridad: Alta
Como vendedor, quiero crear una publicación de producto digital con título, descripción, categoría, precio y enlace al repositorio, para ofrecerlo en el catálogo.
- Criterios de aceptación:
  - El producto queda en estado "en revisión" hasta ser aprobado.
  - Los campos obligatorios no pueden quedar vacíos.

**HU-06** | Prioridad: Alta
Como vendedor, quiero editar o eliminar mis propios productos, para mantener actualizada mi oferta.
- Criterios de aceptación:
  - Solo el vendedor dueño del producto puede editarlo o eliminarlo.
  - Si el producto ya fue comprado, no se puede eliminar, solo archivar.

**HU-07** | Prioridad: Media
Como vendedor, quiero ver el estado de mis publicaciones (en revisión, aprobado, rechazado, publicado), para saber si necesito hacer ajustes.

### Epic 3: Aprobación de productos (Administrador)

**HU-08** | Prioridad: Alta
Como administrador, quiero revisar los productos en estado "en revisión", para aprobarlos o rechazarlos antes de que sean visibles en el catálogo.
- Criterios de aceptación:
  - Al rechazar, debo poder indicar un motivo.
  - El vendedor recibe una notificación con la decisión.

**HU-09** | Prioridad: Baja
Como administrador, quiero gestionar las categorías del catálogo (crear, editar, eliminar), para mantener el catálogo organizado.

### Epic 4: Catálogo y compra (Comprador)

**HU-10** | Prioridad: Alta
Como comprador, quiero explorar el catálogo de productos publicados con filtros por categoría y precio, para encontrar lo que necesito.

**HU-11** | Prioridad: Alta
Como comprador, quiero comprar un producto digital, para obtener acceso a su repositorio.
- Criterios de aceptación:
  - Se registra la transacción con monto y fecha.
  - Tras la compra, se otorga acceso al repositorio privado del producto.
  - **Regla de negocio — venta única:** cada producto solo se puede vender una vez. Al comprarse, pasa a estado `vendido` y desaparece del catálogo público de inmediato; ya no puede ser adquirido por nadie más. Solo sigue siendo visible para el comprador original, en su historial de "Mis compras".

**HU-12** | Prioridad: Media
Como comprador, quiero ver mi historial de compras, para consultar qué productos he adquirido y acceder nuevamente a ellos.

### Epic 5: Calificaciones

**HU-13** | Prioridad: Media
Como comprador, quiero calificar y comentar un producto que compré, para compartir mi experiencia con otros usuarios.
- Criterios de aceptación:
  - Solo puedo calificar productos que ya compré.
  - Solo puedo calificar una vez por compra.

**HU-14** | Prioridad: Baja
Como comprador, quiero ver el promedio de calificaciones y comentarios de un producto en el catálogo, para decidir si comprarlo.

### Epic 6: Paneles y estadísticas

**HU-15** | Prioridad: Media
Como vendedor, quiero ver un panel con mis ventas totales, productos más vendidos y calificación promedio, para evaluar mi desempeño.

**HU-16** | Prioridad: Media
Como administrador, quiero ver estadísticas globales (productos publicados, ventas totales, usuarios activos), para monitorear la salud de la plataforma.

**HU-17** | Prioridad: Baja
Como usuario, quiero recibir notificaciones dentro de la plataforma (aprobación de producto, nueva compra, etc.), para estar al tanto de eventos relevantes sin recargar la página.

## 4. Estructura de endpoints de la API

### Autenticación
| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| POST | /api/auth/registro | Registrar nuevo usuario | Público |
| POST | /api/auth/login | Iniciar sesión, retorna JWT | Público |
| GET | /api/auth/perfil | Obtener datos del usuario autenticado | Autenticado |

### Usuarios
| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | /api/usuarios | Listar usuarios | Admin |
| PATCH | /api/usuarios/:id/estado | Activar/bloquear usuario | Admin |
| POST | /api/usuarios/solicitud-vendedor | Solicitar rol de vendedor | Comprador |

### Categorías
| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | /api/categorias | Listar categorías | Público |
| POST | /api/categorias | Crear categoría | Admin |
| PUT | /api/categorias/:id | Editar categoría | Admin |
| DELETE | /api/categorias/:id | Eliminar categoría | Admin |

### Productos
| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | /api/productos | Listar productos publicados (con filtros) | Público |
| GET | /api/productos/:id | Ver detalle de un producto | Público |
| POST | /api/productos | Crear producto (queda en revisión) | Vendedor |
| PUT | /api/productos/:id | Editar producto propio | Vendedor (dueño) |
| DELETE | /api/productos/:id | Eliminar producto propio | Vendedor (dueño) |
| GET | /api/productos/mios | Listar mis productos con su estado | Vendedor |
| GET | /api/productos/pendientes | Listar productos en revisión | Admin |
| PATCH | /api/productos/:id/aprobar | Aprobar producto | Admin |
| PATCH | /api/productos/:id/rechazar | Rechazar producto (con motivo) | Admin |

### Compras
| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| POST | /api/compras | Registrar compra de un producto | Comprador |
| GET | /api/compras/mias | Ver historial de compras propio | Autenticado |
| GET | /api/compras/:id/acceso | Obtener enlace de acceso al repositorio comprado | Comprador (dueño) |

### Calificaciones
| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| POST | /api/calificaciones | Calificar un producto comprado | Comprador |
| GET | /api/productos/:id/calificaciones | Ver calificaciones de un producto | Público |

### Estadísticas
| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | /api/estadisticas/vendedor | Estadísticas propias de ventas | Vendedor |
| GET | /api/estadisticas/admin | Estadísticas globales de la plataforma | Admin |

### Notificaciones
| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | /api/notificaciones | Listar notificaciones propias | Autenticado |
| PATCH | /api/notificaciones/:id/leida | Marcar notificación como leída | Autenticado |

## 5. Modelo de datos

Ver diagrama entidad-relación generado en la conversación. Entidades principales: `usuarios`, `categorias`, `productos`, `compras`, `calificaciones`, `notificaciones`.

## 6. Próximos pasos sugeridos

1. Definir el backlog en un tablero SCRUM (Trello / Jira / GitHub Projects) organizando las historias de usuario en sprints.
2. Diseñar wireframes de las pantallas clave: catálogo, detalle de producto, dashboard vendedor, dashboard admin.
3. Levantar el entorno de base de datos con Docker Compose.
4. Definir el primer sprint (Sprint 0): configuración de entorno, estructura de proyecto Flask, conexión a base de datos, endpoints de autenticación.
