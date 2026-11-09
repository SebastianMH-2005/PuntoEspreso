# Punto Espresso

Aplicación web de una cafetería de especialidad en Lima: catálogo de productos, carrito, pedidos con recojo en sede y panel de administración. Proyecto del curso **Desarrollo Web Integrado** (UTP, 2026 · Ciclo 2 Agosto).

## Sitio desplegado

| Servicio | Dirección |
|---|---|
| Sitio web (Angular, en Vercel) | https://punto-espreso.vercel.app |
| API REST (Spring Boot, en Render) | https://puntoespreso.onrender.com |
| Documentación Swagger de la API | https://puntoespreso.onrender.com/swagger-ui.html |
| Estado de la API | https://puntoespreso.onrender.com/actuator/health |

> La API usa el plan gratuito de Render: se duerme tras 15 minutos sin visitas, así que la **primera carga puede tardar hasta un par de minutos**. El sitio lo avisa con un mensaje mientras despierta.

## Qué se puede hacer

- **Visitante:** ver inicio, nosotros, catálogo (con filtro por categoría y buscador) y locales con sus horarios; registrarse e iniciar sesión.
- **Cliente:** armar un carrito con varios productos, elegir la sede de recojo, pagar (pago simulado), ver sus pedidos, seguir su estado en vivo y cancelar los pendientes.
- **Operador:** ver las órdenes, filtrarlas por estado y llevarlas de pendiente a entregado (o cancelarlas).
- **Administrador:** todo lo del operador, más el resumen de ventas, y crear, editar y borrar productos, sedes y operadores.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (componentes standalone, señales, sin zone.js), TypeScript, Bootstrap 5 y Bootstrap Icons, formularios reactivos |
| Backend | Java 25, Spring Boot 4, Spring Web, Spring Data JPA (Hibernate), Spring Security con JWT, Bean Validation, Actuator, springdoc (Swagger) |
| Base de datos | PostgreSQL en Supabase |
| Pruebas | Vitest (frontend) |
| Despliegue | Vercel (frontend), Render con Docker (backend), GitHub Actions (integración continua) |

## Arquitectura

```
Navegador ──► Vercel: sitio Angular (archivos estáticos)
                 │  HTTPS + JWT
                 ▼
              Render: API REST Spring Boot (Docker)
                 │  JDBC
                 ▼
              Supabase: PostgreSQL
```

## Estructura del repositorio

```
.
├── backend/                       API REST (Spring Boot)
│   ├── src/main/java/com/puntoespresso/puntoespresso/
│   │   ├── admin/                 controladores y DTO del panel (órdenes, productos, sedes, personal, resumen)
│   │   ├── auth/                  login, registro, JWT y seguridad
│   │   ├── config/                CORS, Swagger y datos iniciales
│   │   ├── controller/            API pública y redirección de las páginas antiguas
│   │   ├── dto/                   entidades JPA
│   │   ├── exception/             errores de la API en JSON
│   │   ├── pedido/                pedidos del cliente
│   │   ├── repository/            acceso a datos (Spring Data JPA)
│   │   └── service/               lógica de negocio
│   ├── src/main/resources/        application.properties
│   ├── Dockerfile
│   └── .env.example               plantilla de variables de entorno
├── frontend/punto-espresso/       sitio web (Angular)
│   ├── src/app/
│   │   ├── core/                  servicios, interceptor, guards, modelos, utilidades y validadores
│   │   ├── shared/                header, footer, product-card, carousel, field-error
│   │   └── features/              about, admin, auth, cart, catalog, checkout, contact, home, not-found, orders
│   ├── public/                    imágenes, robots.txt y sitemap.xml
│   └── vercel.json
└── .github/workflows/ci.yml       compila el backend en cada push
```

## Cómo ejecutarlo en local

**Requisitos:** JDK 25, Node.js 24 con npm, Angular CLI 22 y una base PostgreSQL (por ejemplo, un proyecto gratuito de Supabase).

### Backend

1. Copia `backend/.env.example` como `backend/.env` y completa tus datos (nunca subas `.env` a Git).
2. Ejecuta, desde CMD en la carpeta `backend`:

```bat
set SPRING_DATASOURCE_URL=jdbc:postgresql://TU-HOST:5432/postgres
set SPRING_DATASOURCE_USERNAME=postgres
set SPRING_DATASOURCE_PASSWORD=tu_password
set JWT_SECRET=una_cadena_de_32_o_mas_caracteres
gradlew bootRun
```

   En VS Code también puedes usar la configuración de `.vscode/launch.json`, que lee el archivo `.env`.

3. La API queda en http://localhost:8080 (Swagger en `/swagger-ui.html`). Al arrancar por primera vez crea las tablas y carga categorías, 10 productos, 3 sedes y el usuario administrador.

### Frontend

```bat
cd frontend\punto-espresso
npm install
ng serve
```

El sitio queda en http://localhost:4200 y usa la API de `http://localhost:8080` (ver `src/environments/environment.development.ts`).

## Variables de entorno del backend

| Variable | Para qué sirve |
|---|---|
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Conexión a PostgreSQL |
| `JWT_SECRET` | Clave para firmar los tokens (mínimo 32 caracteres) |
| `JWT_EXPIRATION_MS` | Duración del token (por defecto 24 horas) |
| `APP_CORS_ALLOWED_ORIGINS` | Sitios autorizados a llamar a la API, separados por coma y sin barra final |
| `FRONTEND_URL` | Dirección del sitio al que redirigen las páginas antiguas del backend |
| `ADMIN_SEED_PASSWORD` | Contraseña del administrador inicial (solo se usa si no hay personal en la base) |
| `TZ` | Zona horaria del servidor (`America/Lima`); afecta fechas y el resumen de ventas |
| `SPRINGDOC_SWAGGER_UI_ENABLED`, `SPRINGDOC_API_DOCS_ENABLED` | `false` para ocultar la documentación Swagger |
| `JPA_SHOW_SQL` | `true` para ver las consultas SQL en el log |

## Cuentas de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin@puntoespresso.pe` | *(se entrega al profesor por la plataforma)* |
| Operador | lo crea el administrador en **Panel → Personal** | la que se defina al crearlo |
| Cliente | se crea en **/registro** | la que elija |

**Pago de prueba:** el pago es simulado y los datos de la tarjeta nunca se envían ni se guardan. Sirve cualquier número de 16 dígitos (por ejemplo `4111111111111111`), un vencimiento futuro (`MM/AA`) y un CVV de 3 dígitos.

## Roles y permisos

| Recurso | Visitante | Cliente | Operador | Administrador |
|---|:-:|:-:|:-:|:-:|
| Catálogo, sedes y categorías (`GET /api/productos`, `/api/sedes`, `/api/categorias`) | ✅ | ✅ | ✅ | ✅ |
| Crear y ver pedidos propios (`/api/pedidos/**`) | ❌ | ✅ | ❌ | ❌ |
| Atender órdenes (`/api/admin/ordenes/**`) | ❌ | ❌ | ✅ | ✅ |
| Productos, sedes, personal y resumen (`/api/admin/**`) | ❌ | ❌ | ❌ | ✅ |

La seguridad real está en el backend (Spring Security + JWT); los guards de Angular solo mejoran la experiencia.

## Endpoints principales

| Método y ruta | Descripción |
|---|---|
| `POST /api/auth/login` | Inicia sesión y devuelve el token JWT |
| `POST /api/auth/registro` | Registra un cliente |
| `GET /api/productos`, `/api/productos/{id}`, `/api/categorias`, `/api/sedes` | Datos públicos |
| `POST /api/pedidos` | Crea un pedido con varios productos y la sede de recojo |
| `GET /api/pedidos/mis-ordenes`, `PUT /api/pedidos/mis-ordenes/{id}/cancelar` | Pedidos del cliente |
| `GET /api/admin/ordenes`, `PUT /api/admin/ordenes/{id}/estado` | Atención de órdenes |
| `/api/admin/productos`, `/api/admin/sedes` | Altas, bajas y cambios (GET, POST, PUT, DELETE) |
| `GET/POST/DELETE /api/admin/usuarios` | Personal (operadores) |
| `GET /api/admin/dashboard?dias=7` | Resumen de ventas |

Los errores de la API responden en JSON con el campo `message`.

## Pruebas

- **Frontend:** `ng test --no-watch` (en `frontend/punto-espresso`) ejecuta 147 pruebas con Vitest: servicios, guards, formularios, páginas y rutas protegidas.
- **Backend:** la integración continua compila con `gradlew build -x test`; el test de arranque de Spring necesita una base de datos real.

## Despliegue

- **Render:** servicio Docker con *Root Directory* `backend`, y las variables de la tabla anterior.
- **Vercel:** *Root Directory* `frontend/punto-espresso`; `vercel.json` define la carpeta de salida y redirige todas las rutas a `index.html`.
- **Supabase:** base PostgreSQL; las tablas las crea Hibernate al arrancar.
- Cada `git push` a `main` vuelve a desplegar ambos servicios.

## Dónde está cada criterio del ATF3

| Criterio | Dónde verlo |
|---|---|
| Organización del proyecto | `src/app/core`, `shared` y `features` (organización por funcionalidades) |
| Sistema de rutas y página 404 | `src/app/app.routes.ts` (carga diferida, guards por rol; la ruta `**` abre `features/not-found`) |
| Diseño homogéneo | Bootstrap 5 y la paleta de la marca en `src/styles.scss` |
| Inicio de sesión contra la API | `core/services/auth.service.ts` y `features/auth/login` (recibe el token JWT) |
| Servicios con `inject()` | `core/services/*` y `core/interceptors/auth.interceptor.ts` (sin inyección por constructor) |
| Componentes reutilizables y páginas | `shared/*` (5 componentes) y 10 páginas en `features/*` |
| Formularios reactivos con validación | login, registro, pago, producto, sede y personal, más los buscadores y filtros; los mensajes los muestra `shared/field-error` |

## Notas de diseño

- Las imágenes de productos viven en `frontend/punto-espresso/public/img`; la base de datos solo guarda el nombre del archivo.
- El token se guarda en `localStorage` y un interceptor lo envía en cada petición a la API; si vence, se cierra la sesión.
- El carrito se guarda en el navegador y el servidor vuelve a calcular precios y stock al crear el pedido.

## Integrantes

- Sebastian Millones Huayta
- Alonso Esteban Dioses Ticona
- Alexis Jordan Loayza Aquipucho
- Carlos Daniel Macedo Benique