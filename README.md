# RIWI Market — Marketplace de Productos Digitales (Node.js)

Plataforma web que permite a los coders y egresados de RIWI publicar, promocionar y vender productos digitales desarrollados durante su proceso de formación.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Frontend | HTML + CSS + JavaScript (vanilla), SPA con router por hash |
| Alertas | SweetAlert2 (vía CDN) |
| Base de datos | PostgreSQL 16 (Docker) |
| Autenticación | JWT (jsonwebtoken) + bcrypt |
| DB access | pg (node-postgres), raw SQL |

## Estructura del proyecto

```
riwi-market-node/
├── backend/              # API REST en Express
│   ├── app.js            # Entry point
│   ├── .env              # Variables de entorno
│   ├── db/
│   │   └── connection.js # Pool de PostgreSQL
│   ├── middleware/
│   │   └── auth.js       # JWT + roles
│   ├── models/           # Acceso a datos
│   └── routes/           # Endpoints por módulo
│
├── frontend/             # SPA HTML/CSS/JS
│   ├── index.html
│   ├── css/style.css
│   └── js/               # Router + vistas
│
├── database/
│   ├── docker-compose.yml
│   └── schema_marketplace_riwi.sql
│
└── docs/
```

## Requisitos previos

- Node.js 18+
- Docker y Docker Compose
- Un navegador web

## Instalación

### 1. Base de datos

```bash
cd database
docker-compose up -d
```

Levanta PostgreSQL en `localhost:5432` con las tablas y datos iniciales.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

El servidor queda en `http://localhost:5000`.

**Usuario admin inicial:** `admin@riwi.io` / `Admin123!` (se crea automáticamente al iniciar).

### 3. Frontend

Abrir `frontend/index.html` con Live Server.

## Uso rápido

1. Registrarse en `#/registro`
2. Iniciar sesión en `#/login`
3. En `#/perfil`, solicitar ser vendedor
4. Como admin, aprobar desde `#/dashboard-admin`
5. Publicar producto desde `#/dashboard-vendedor`
6. Comprar desde `#/catalogo`
