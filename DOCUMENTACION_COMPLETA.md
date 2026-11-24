# Documentación completa — Ventech

## 1. Descripción general

Ventech es una tienda académica de productos tecnológicos. El proyecto incluye:

- Tienda pública, catálogo, buscador, carrito y checkout.
- Registro e inicio de sesión de clientes.
- Panel administrativo de productos, inventario, ventas, usuarios, reportes, categorías y promociones.
- Panel analítico web y vistas para Power BI.
- API local en ASP.NET Core conectada a SQL Server.
- Base de datos `Ventech` en el servidor `DESKTOP-39ODHJC`.

## 2. Arquitectura

```text
Navegador
  ├─ HTML + CSS + JavaScript
  └─ http://localhost:5097/api
       └─ ASP.NET Core API
            └─ SQL Server / Base de datos Ventech / Esquema vt
```

La API también sirve los archivos del proyecto desde `http://localhost:5097/HTML/`.

## 3. Cómo ejecutar

1. Abre `Backend/Iniciar-Ventech-Api.bat`.
2. Espera a que el servicio inicie.
3. Abre `http://localhost:5097/HTML/Ventech.html`.
4. Para el panel administrativo usa `administracion.html`.

La comprobación de conexión está disponible en:

```text
http://localhost:5097/api/health
```

## 4. Estructura de carpetas

| Carpeta o archivo | Propósito |
|---|---|
| `HTML/` | Páginas de la tienda, cliente, administración y analítica. |
| `JS/` | Interacciones del navegador y conexión con la API. |
| `Style/` | Estilos CSS organizados por módulo. |
| `Backend/` | API ASP.NET Core, conexión a SQL Server y reglas de negocio. |
| `Database/` | Scripts de creación y actualización de la base de datos. |
| `PowerBI/` | Tema, medidas DAX y diseño sugerido de Power BI. |
| `DOCUMENTACION_COMPLETA.md` | Este documento. |

## 5. Páginas HTML

| Archivo | Función |
|---|---|
| `HTML/Ventech.html` | Página principal, promoción, buscador, catálogo, ofertas y carrito. |
| `HTML/auth.html` | Registro e inicio de sesión de clientes. |
| `HTML/checkout.html` | Dirección, método de pago y confirmación de pedido. |
| `HTML/mi-cuenta.html` | Perfil de cliente, pedidos, facturas y cancelaciones. |
| `HTML/administracion.html` | Panel interno: inventario, productos, usuarios, ventas, categorías, promociones y reportes. |
| `HTML/dashboard-analitico.html` | Dashboard web conectado a SQL Server. |
| `HTML/orders.html` | Vista anterior de compras. |
| `HTML/admin.html` | Redirige al panel administrativo actualizado. |

## 6. JavaScript

| Archivo | Responsabilidad |
|---|---|
| `JS/app.js` | Catálogo, filtros, buscador, carrito, registro, inicio de sesión, checkout, facturas y pedidos públicos. |
| `JS/admin-panel.js` | Inicio de sesión local de personal, productos, inventario, categorías, ventas físicas, usuarios, promociones y reportes. |
| `JS/customer.js` | Panel del cliente, seguimiento, factura, perfil y cancelación. |
| `JS/sql-sync.js` | Sincroniza automáticamente el inventario local con SQL Server. |
| `JS/promotion.js` | Obtiene la promoción activa y la muestra en el inicio. |
| `JS/dashboard-analitico.js` | Consume el endpoint analítico y pinta tarjetas, tablas y gráficos. |

## 7. CSS

| Archivo | Diseño aplicado |
|---|---|
| `Style/main.css` | Tienda pública, producto, carrito, checkout y promoción. |
| `Style/admin-plus.css` | Panel administrativo, tablas, formularios, categorías e inventario. |
| `Style/customer.css` | Panel de cuenta del cliente, pedidos e invoice. |
| `Style/dashboard-analitico.css` | Dashboard analítico de ventas e inventario. |

## 8. Backend

### Archivos

- `Backend/Program.cs`: configura CORS, archivos estáticos, endpoints de productos, categorías, promociones, analítica e inventario.
- `Backend/BusinessEndpoints.cs`: endpoints de clientes, autenticación, pedidos, pagos, facturas y cancelaciones.
- `Backend/appsettings.json`: cadena de conexión de SQL Server.
- `Backend/Iniciar-Ventech-Api.bat`: ejecuta la API local.

### Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Comprueba SQL Server. |
| GET | `/api/products` | Lista productos para la tienda. |
| POST | `/api/products/sync` | Guarda productos sincronizados desde el panel. |
| GET/POST/PUT | `/api/categories` | Consulta, crea y modifica categorías. |
| GET/PUT | `/api/promotion` | Obtiene o publica la promoción principal. |
| GET | `/api/inventory/alerts` | Productos con stock bajo o inhabilitados. |
| GET | `/api/dashboard` | Datos consolidados del dashboard web. |
| POST | `/api/auth/register` | Registra cliente. |
| POST | `/api/auth/login` | Inicia sesión del cliente. |
| GET | `/api/customers/{email}/orders` | Pedidos del cliente. |
| POST | `/api/orders` | Crea pedido, detalle, pago y factura. |
| PATCH | `/api/orders/{id}/cancel` | Cancela pedido, restaura stock y anula factura. |

## 9. Base de datos

La base de datos usa el esquema `vt`.

| Tabla | Función |
|---|---|
| `Usuarios` | Clientes y personal registrado. |
| `Roles`, `UsuarioRoles` | Roles y permisos. |
| `Categorias` | Categorías de productos tecnológicos. |
| `Productos` | Información, precio, IVA, descuento, stock y estado. |
| `ProductoImagenes` | Imagen principal o adicional del producto. |
| `MovimientosInventario` | Historial de entradas y salidas. |
| `Pedidos` | Encabezado de la compra. |
| `DetallePedidos` | Productos incluidos en cada pedido. |
| `Pagos` | Método, estado y valor de pago. |
| `Facturas` | Facturación asociada a pedidos. |
| `PedidosCancelados` | Histórico de pedidos anulados. |
| `Promociones` | Imagen, título y texto de la promoción de inicio. |
| `SesionesEmpleados`, `ActividadEmpleados` | Control de actividad y turnos. |

### Scripts SQL

- `Database/01_schema_ventech.sql`: crea el esquema inicial.
- `Database/02_pedidos_cancelados.sql`: agrega el historial de cancelaciones.
- `Database/03_powerbi_views.sql`: crea las vistas analíticas.

## 10. Flujo de inventario

1. Administrador crea o edita un producto.
2. El producto se guarda localmente para la interfaz.
3. `sql-sync.js` lo envía automáticamente a `/api/products/sync`.
4. La API crea o actualiza categoría, producto e imagen en SQL Server.
5. La tienda y el dashboard consultan la información actualizada.

## 11. Flujo de compra y factura

1. Cliente crea cuenta o inicia sesión.
2. Agrega productos disponibles al carrito.
3. En checkout registra dirección y pago.
4. La API comprueba el stock y crea pedido, detalle, pago y factura.
5. El stock se descuenta automáticamente.
6. El cliente ve el pedido, seguimiento y factura en `mi-cuenta.html`.

## 12. Cancelaciones

Cuando se cancela un pedido en estado `Procesando`:

1. Se registra un historial en `PedidosCancelados`.
2. Se restablece el stock de los productos.
3. El pedido cambia a `Cancelado`.
4. La factura pasa a `Anulada`.

## 13. Promociones

En **Administración > Configuración** se puede cargar una imagen desde el equipo, junto con título y texto. La promoción se guarda en `vt.Promociones` y aparece en la página principal. Solo existe una promoción activa a la vez.

## 14. Dashboard y Power BI

El dashboard web muestra ventas netas, pedidos, clientes, inventario, tendencia, métodos de pago, cancelaciones y últimos pedidos.

Las vistas para Power BI son:

- `vw_PBI_Resumen`
- `vw_PBI_Ventas`
- `vw_PBI_DetalleVentas`
- `vw_PBI_Inventario`
- `vw_PBI_Clientes`
- `vw_PBI_Cancelados`

Los recursos de Power BI están en la carpeta `PowerBI/`.

## 15. Recomendaciones futuras

- Proteger endpoints administrativos con autenticación real y permisos.
- Guardar imágenes como archivos o almacenamiento externo en producción.
- Agregar recuperación de contraseña mediante correo.
- Crear copias de seguridad programadas de SQL Server.
- Publicar la aplicación en un servidor seguro antes de uso comercial.
