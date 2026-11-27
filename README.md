# Ventech

Ventech es una aplicación académica de comercio electrónico para productos tecnológicos. Incluye tienda pública, catálogo, carrito, registro e inicio de sesión, checkout, cuenta de cliente, inventario por color, panel administrativo, reportes, API ASP.NET Core, scripts de SQL Server y Supabase, y recursos para Power BI.

## Enlaces

- Sitio publicado: <https://ventech-ew3.pages.dev/>
- Repositorio: <https://github.com/zapataosorio17/Ventech>
- Manual completo de entrega: [docs/GUIA_ENTREGA.md](docs/GUIA_ENTREGA.md)
- Referencia archivo por archivo: [docs/REFERENCIA_ARCHIVOS.md](docs/REFERENCIA_ARCHIVOS.md)
- Documentación funcional existente: [DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md)
- Instrucciones de publicación: [LEEME_PUBLICACION.txt](LEEME_PUBLICACION.txt)

## Funciones principales

- Catálogo compartido almacenado en Supabase.
- Búsqueda, filtros, ofertas, detalle y galería de productos.
- Carrito persistente en el navegador.
- Autenticación de clientes mediante Supabase Auth.
- Checkout académico con PSE o tarjeta simulados.
- Creación transaccional de pedidos y descuento de inventario.
- Inventario general y por variante de color.
- Cuenta del cliente con resumen, pedidos, facturas y datos personales.
- Panel administrativo protegido por rol.
- API local ASP.NET Core conectada a SQL Server.
- Dashboard web y recursos para Power BI.
- Validación automática de páginas y recursos con GitHub Actions.

## Inicio rápido de la versión publicada

1. Abre <https://ventech-ew3.pages.dev/>.
2. Crea una cuenta desde **Crear cuenta**.
3. Si Supabase exige confirmación, confirma el correo antes de ingresar.
4. Agrega un producto al carrito.
5. Abre **Mi cuenta**, completa la dirección y elige un método de pago simulado.
6. Confirma el pedido.

> Los pagos son simulaciones académicas. El proyecto no procesa dinero real.

## Inicio rápido local

### Solo interfaz pública

Sirve la raíz del repositorio con un servidor HTTP. No abras los HTML mediante `file://` porque los módulos JavaScript y las solicitudes remotas pueden ser bloqueados por el navegador.

```powershell
cd C:\Users\USUARIO\Dropbox\Proyecto\Ventech
python -m http.server 8080
```

Después abre <http://localhost:8080/>.

### API ASP.NET Core + SQL Server

1. Instala .NET SDK 10 y SQL Server.
2. Ejecuta en SQL Server los scripts `Database/01_...` a `Database/06_...` en orden.
3. Copia `Backend/appsettings.example.json` como `Backend/appsettings.json`.
4. Ajusta la cadena `ConnectionStrings:Ventech`.
5. Ejecuta `Backend/Iniciar-Ventech-Api.bat`.
6. Comprueba <http://localhost:5097/api/health>.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Interfaz | HTML5, CSS3 y JavaScript sin framework |
| Sitio público | Cloudflare Pages |
| Autenticación pública | Supabase Auth |
| Datos públicos | Supabase PostgreSQL y PostgREST |
| API local | ASP.NET Core Minimal API, .NET 10 |
| Base local | Microsoft SQL Server |
| Analítica | Dashboard JavaScript y Power BI |
| Automatización | GitHub Actions |

## Seguridad

- `Backend/appsettings.json` está excluido de Git.
- Solo se publica `Backend/appsettings.example.json`, sin credenciales.
- La clave del frontend es una clave publicable de Supabase y debe estar protegida mediante RLS.
- La función `place_order` se ejecuta como una transacción en la base de datos.
- Nunca se debe colocar una clave `service_role`, contraseña o cadena de conexión productiva en los archivos públicos.

## Pruebas

```powershell
node tests/smoke.mjs
dotnet build Backend/Ventech.Api.csproj
```

Cada `push` a `main` ejecuta la validación de páginas, referencias y sintaxis JavaScript definida en `.github/workflows/validate-site.yml`.

## Licencia y alcance

Proyecto académico. Antes de utilizarlo comercialmente se deben implementar pasarela de pagos real, gestión formal de secretos, auditoría de seguridad, copias de seguridad, observabilidad y pruebas automatizadas adicionales.
