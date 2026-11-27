# Referencia de archivos — Ventech

## 1. Versión canónica publicada

| Archivo | Uso |
|---|---|
| `index.html` | Entrada principal desplegada por Cloudflare Pages. |
| `Ventech.html` | Entrada alternativa compatible con enlaces históricos. |
| `main.css` | Diseño general de la tienda, catálogo, producto, carrito y checkout. |
| `app.js` | Estado del catálogo y carrito, filtros, detalle y funciones públicas. |
| `sql-sync.js` | Carga catálogo desde Supabase en publicación y desde API en local. |
| `promotion.js` | Carga la promoción cuando el backend local está disponible. |
| `auth.html` | Formularios de registro e inicio de sesión. |
| `supabase-auth.js` | Registro, login, recuperación y perfil mediante Supabase Auth. |
| `checkout.html` | Vista histórica/directa de checkout. |
| `mi-cuenta.html` | Panel de cliente y checkout actual. |
| `customer.css` | Diseño del panel del cliente. |
| `customer.js` | Perfil, resumen, carrito, pedidos, facturas y confirmación. |
| `supabase-checkout.js` | Invoca la función RPC `place_order`. |
| `administracion.html` | Panel administrativo principal. |
| `admin.html` | Redirección o compatibilidad del acceso administrativo. |
| `admin-plus.css` | Diseño del panel administrativo. |
| `admin-panel.js` | Productos, categorías, usuarios, ventas, inventario y reportes. |
| `supabase-admin-guard.js` | Valida sesión, perfil activo y rol administrativo. |
| `supabase-catalog-sync.js` | Sincroniza catálogo administrativo con Supabase. |
| `dashboard-analitico.html` | Dashboard web. |
| `dashboard-analitico.css` | Diseño del dashboard. |
| `dashboard-analitico.js` | Consulta datos analíticos del backend local y dibuja indicadores. |
| `orders.html` | Vista de compatibilidad para compras. |
| `terminos.html` | Términos y condiciones del proyecto. |
| `_headers` | Política de caché utilizada por Cloudflare Pages. |

## 2. Backend

| Archivo | Uso |
|---|---|
| `Backend/Ventech.Api.csproj` | Proyecto .NET 10 y dependencias NuGet. |
| `Backend/Program.cs` | Inicio de la API, CORS, conexión, productos, categorías, promoción, inventario y dashboard. |
| `Backend/BusinessEndpoints.cs` | Autenticación local, clientes, pedidos, pagos, facturas, estados y cancelación. |
| `Backend/Iniciar-Ventech-Api.bat` | Inicia la API en `http://localhost:5097`. |
| `Backend/appsettings.example.json` | Plantilla de conexión segura. |
| `Backend/appsettings.json` | Configuración local; está ignorada y no debe publicarse. |

## 3. Base de datos

| Script | Uso y momento de ejecución |
|---|---|
| `01_schema_ventech.sql` | Instalación inicial de SQL Server. |
| `02_pedidos_cancelados.sql` | Amplía SQL Server con cancelaciones. |
| `03_powerbi_views.sql` | Agrega vistas analíticas. |
| `04_calificaciones_producto.sql` | Agrega calificaciones. |
| `05_historial_estados_pedido.sql` | Agrega trazabilidad. |
| `06_atributos_producto.sql` | Agrega atributos del catálogo. |
| `09_supabase_variantes_color.sql` | Añade variantes de color en Supabase. |
| `10_supabase_stock_por_color.sql` | Normaliza, valida y sincroniza inventario por color. |
| `11_supabase_checkout.sql` | Crea el checkout transaccional actual. |
| `12_hotfix_order_status.sql` | Corrige una función antigua que usaba `Procesando`. |
| `13_hotfix_order_item_name.sql` | Corrige una función antigua sin `product_name`. |

Los hotfix 12 y 13 son para instalaciones existentes; no sustituyen al script consolidado 11 en instalaciones nuevas.

## 4. Power BI

| Archivo | Uso |
|---|---|
| `PowerBI/Diseno profesional del reporte.md` | Distribución visual sugerida. |
| `PowerBI/Medidas DAX Ventech.txt` | Medidas calculadas recomendadas. |
| `PowerBI/Ventech Tema.json` | Colores y estilos importables en Power BI. |

## 5. Calidad y automatización

| Archivo | Uso |
|---|---|
| `tests/smoke.mjs` | Comprueba páginas y recursos requeridos. |
| `.github/workflows/validate-site.yml` | Ejecuta pruebas después de push o pull request. |
| `.gitignore` | Excluye secretos, binarios, temporales y copias locales. |

## 6. Documentación

| Archivo | Uso |
|---|---|
| `README.md` | Presentación y acceso rápido. |
| `docs/GUIA_ENTREGA.md` | Instalación, uso, demostración y entrega. |
| `docs/REFERENCIA_ARCHIVOS.md` | Esta referencia archivo por archivo. |
| `DOCUMENTACION_COMPLETA.md` | Documentación funcional anterior conservada. |
| `LEEME_PUBLICACION.txt` | Pasos breves de publicación académica. |

## 7. Versión histórica

Las carpetas `html/`, `JS/`, `Style/` e `Imagen/` conservan una organización modular anterior. Son útiles para trazabilidad y comparación, pero la publicación vigente utiliza los archivos de la raíz. Una corrección destinada a producción debe aplicarse primero a la versión canónica.

## 8. Almacenamiento local del navegador

La interfaz utiliza claves con prefijo `vt_` para conservar sesión visual, carrito y datos auxiliares. Esto mejora la experiencia, pero no sustituye las validaciones del servidor. El stock, la identidad y la creación definitiva del pedido deben verificarse en Supabase o en la API.

## 9. Convención de cambios

Antes de publicar:

1. modificar la versión canónica;
2. ejecutar pruebas;
3. revisar `git diff`;
4. comprobar que no se incluyeron secretos;
5. crear un commit descriptivo;
6. hacer push a `main`;
7. verificar GitHub Actions;
8. verificar Cloudflare y Supabase.
