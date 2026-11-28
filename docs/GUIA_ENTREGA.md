# Guía detallada de entrega — Ventech

## 1. Propósito de este documento

Esta guía permite instalar, ejecutar, demostrar, evaluar y entregar Ventech. Está redactada para que una persona que no participó en el desarrollo pueda entender:

- qué problema resuelve;
- qué contiene cada componente;
- cómo se conectan las tecnologías;
- cómo preparar las bases de datos;
- cómo ejecutar el proyecto localmente;
- cómo utilizar el sitio publicado;
- cómo demostrar los flujos principales;
- qué evidencias conviene presentar;
- qué limitaciones corresponden al alcance académico.

## 2. Identificación del proyecto

| Campo | Valor |
|---|---|
| Nombre | Ventech |
| Tipo | Comercio electrónico académico |
| Sector | Venta de productos tecnológicos |
| Interfaz | HTML, CSS y JavaScript |
| Publicación | Cloudflare Pages |
| Backend público | Supabase |
| Backend local | ASP.NET Core Minimal API |
| Bases de datos | PostgreSQL de Supabase y SQL Server local |
| Analítica | Dashboard web y Power BI |
| Repositorio | `zapataosorio17/Ventech` |
| Rama de producción | `main` |

## 3. Problema que resuelve

Ventech centraliza un proceso académico de ventas tecnológicas. El cliente puede consultar productos, aplicar filtros, administrar un carrito, registrarse, iniciar sesión y generar un pedido simulado. El personal autorizado puede administrar catálogo e inventario. Los datos sirven además como fuente de reportes y análisis.

El proyecto demuestra competencias de:

- diseño de interfaces responsivas;
- programación JavaScript;
- consumo de API REST;
- autenticación y autorización;
- modelado relacional;
- transacciones e inventario;
- desarrollo de API con .NET;
- publicación continua;
- documentación y pruebas;
- visualización de datos.

## 4. Alcance funcional

### 4.1 Cliente

El cliente puede:

1. visualizar el catálogo activo;
2. buscar por nombre, marca o categoría;
3. filtrar por categoría y precio;
4. revisar precio original, descuento, IVA y disponibilidad;
5. consultar imágenes, descripción, especificaciones, capacidad y colores;
6. agregar productos al carrito;
7. modificar cantidades o retirar productos;
8. crear una cuenta e iniciar sesión;
9. registrar dirección de entrega;
10. seleccionar PSE o tarjeta como simulación;
11. confirmar un pedido;
12. consultar resumen, pedidos, facturas y perfil.

### 4.2 Administración

El panel contempla:

- productos;
- categorías;
- inventario y stock por color;
- usuarios;
- ventas y estados de pedido;
- promociones;
- reportes;
- configuración;
- acceso condicionado por perfil y rol en Supabase.

### 4.3 Analítica

El proyecto incorpora:

- dashboard analítico web;
- vistas SQL para Power BI;
- medidas DAX sugeridas;
- tema visual de Power BI;
- documento con diseño recomendado del reporte.

## 5. Arquitectura

### 5.1 Arquitectura publicada

```text
Usuario
  │
  ▼
Cloudflare Pages
  ├─ HTML
  ├─ CSS
  └─ JavaScript
       │
       ├─ Supabase Auth
       ├─ Supabase REST / PostgreSQL
       └─ RPC public.place_order(...)
```

Cloudflare sirve archivos estáticos. Supabase aporta autenticación, tablas, políticas RLS y funciones PostgreSQL. La creación del pedido y el descuento del inventario se realizan juntos dentro de `place_order`; si cualquier validación falla, PostgreSQL revierte toda la operación.

### 5.2 Arquitectura local académica

```text
Navegador local
  │ HTTP :5097
  ▼
ASP.NET Core Minimal API
  │ Microsoft.Data.SqlClient
  ▼
SQL Server / base Ventech / esquema vt
```

Esta modalidad conserva el desarrollo original y permite demostrar API, reglas de negocio, SQL Server y Power BI. No es el backend utilizado directamente por Cloudflare Pages.

### 5.3 Por qué existen dos bases

- **Supabase:** permite que el sitio público funcione desde Internet sin depender del computador del desarrollador.
- **SQL Server:** conserva la implementación académica local, endpoints .NET, procedimientos y vistas para Power BI.

No se debe asumir que un cambio en SQL Server aparecerá automáticamente en Supabase, ni al contrario.

## 6. Estructura general

| Ruta | Uso |
|---|---|
| Archivos HTML/CSS/JS de la raíz | Aplicación canónica publicada |
| `Backend/` | API local ASP.NET Core |
| `Database/` | Esquemas, migraciones y parches SQL |
| `PowerBI/` | Tema, medidas y diseño de analítica |
| `tests/` | Pruebas automáticas de humo |
| `.github/workflows/` | Integración continua |
| `html/`, `JS/`, `Style/` | Versión histórica/modular conservada como referencia |
| `Imagen/` | Recursos gráficos de la versión histórica |
| `postman/` | Configuración base para pruebas de API |
| `docs/` | Manuales de entrega y referencia |

La aplicación publicada utiliza principalmente los archivos ubicados en la raíz. Las carpetas históricas no deben mezclarse con la versión canónica al corregir el sitio.

## 7. Requisitos

### 7.1 Para utilizar el sitio publicado

- navegador actualizado;
- conexión a Internet;
- correo válido si la confirmación está habilitada en Supabase.

### 7.2 Para desarrollo del frontend

- Git;
- Node.js 22 o compatible para ejecutar pruebas;
- un servidor HTTP local;
- editor como Visual Studio Code.

### 7.3 Para el backend local

- Windows 10/11;
- .NET SDK 10;
- SQL Server;
- SQL Server Management Studio o herramienta equivalente;
- acceso integrado de Windows o una cadena de conexión válida.

### 7.4 Para publicar

- cuenta de GitHub con acceso al repositorio;
- proyecto Cloudflare Pages conectado a `main`;
- proyecto Supabase configurado;
- RLS y funciones SQL instaladas.

## 8. Descargar y preparar

```powershell
git clone https://github.com/zapataosorio17/Ventech.git
cd Ventech
git status
```

El resultado esperado de `git status` es una rama `main` limpia. No se debe copiar un `.git` de otro proyecto ni usar un remoto de ejemplo.

## 9. Ejecutar el frontend local

### Alternativa con Python

```powershell
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080/
```

### Alternativa con extensión de servidor

Puede usarse Live Server, siempre que la URL sea HTTP. Abrir directamente `index.html` como `file://` puede impedir la carga de módulos ES y solicitudes CORS.

## 10. Preparar Supabase

### 10.1 Componentes esperados

La versión pública utiliza, como mínimo:

- Supabase Auth;
- `profiles`;
- `categories`;
- `products`;
- `orders`;
- `order_items`;
- función RPC `place_order`;
- políticas RLS compatibles con clientes y administradores.

### 10.2 Orden de scripts para una instalación actual

1. Crear las tablas y políticas base del proyecto Supabase.
2. Ejecutar `Database/09_supabase_variantes_color.sql`.
3. Ejecutar `Database/10_supabase_stock_por_color.sql`.
4. Ejecutar la versión más reciente de `Database/11_supabase_checkout.sql`.
5. Ejecutar `Database/14_supabase_cancel_order.sql`.

Los archivos `12_hotfix_order_status.sql` y `13_hotfix_order_item_name.sql` existen para actualizar instalaciones antiguas. En una instalación nueva y actualizada, `11_supabase_checkout.sql` ya contiene ambas correcciones.

`14_supabase_cancel_order.sql` crea la cancelación transaccional: solo el propietario puede cancelar un pedido en estado `procesando`; la función restaura el stock general o el de la variante de color y cambia el estado a `cancelado` en la misma transacción. Una segunda cancelación es rechazada para impedir duplicar inventario.

### 10.3 Verificación de la función

El checkout debe:

1. identificar al usuario mediante `auth.uid()`;
2. rechazar un carrito vacío;
3. validar que el perfil esté activo;
4. bloquear cada producto mientras comprueba el inventario;
5. validar el color seleccionado;
6. descontar stock;
7. calcular base, descuento, IVA y total;
8. insertar `orders` y `order_items`;
9. devolver identificador, número, total y estado;
10. revertir todo si ocurre un error.

### 10.4 RLS

La clave publicable visible en JavaScript no reemplaza la seguridad. Las políticas deben impedir que:

- un cliente consulte pedidos de otro usuario;
- un cliente se asigne rol administrativo;
- un usuario anónimo modifique inventario;
- un usuario común elimine productos;
- se invoquen funciones administrativas sin autorización.

Nunca debe publicarse la clave `service_role`.

## 11. Preparar SQL Server

Ejecutar en orden:

1. `01_schema_ventech.sql`: esquema `vt`, tablas y datos esenciales.
2. `02_pedidos_cancelados.sql`: cancelaciones.
3. `03_powerbi_views.sql`: vistas analíticas.
4. `04_calificaciones_producto.sql`: calificaciones.
5. `05_historial_estados_pedido.sql`: trazabilidad de estados.
6. `06_atributos_producto.sql`: atributos adicionales.

Antes de ejecutar scripts en una base con información real se debe realizar una copia de seguridad.

## 12. Configurar y ejecutar la API

1. Copiar el archivo de ejemplo:

```powershell
Copy-Item Backend/appsettings.example.json Backend/appsettings.json
```

2. Editar la cadena:

```json
{
  "ConnectionStrings": {
    "Ventech": "Server=SERVIDOR;Database=Ventech;Integrated Security=True;TrustServerCertificate=True;Encrypt=True"
  }
}
```

3. Restaurar y compilar:

```powershell
dotnet restore Backend/Ventech.Api.csproj
dotnet build Backend/Ventech.Api.csproj
```

4. Ejecutar:

```powershell
Backend\Iniciar-Ventech-Api.bat
```

5. Comprobar:

```text
http://localhost:5097/api/health
```

`appsettings.json` está ignorado por Git. No se debe forzar su publicación.

## 13. Uso del sitio como cliente

### 13.1 Catálogo

1. Abrir la página principal.
2. Esperar la carga desde Supabase.
3. Usar la búsqueda o los filtros.
4. Revisar stock y descuento.
5. Abrir el detalle si se requieren más imágenes o especificaciones.

### 13.2 Carrito

1. Pulsar **Agregar al carrito**.
2. Abrir el icono del carrito.
3. Ajustar cantidades sin superar el inventario.
4. Verificar subtotal, descuento e IVA.
5. Continuar al checkout.

### 13.3 Cuenta

1. Crear una cuenta con datos válidos.
2. Confirmar el correo si Supabase lo solicita.
3. Iniciar sesión.
4. Confirmar que aparece el nombre y el correo del perfil.

### 13.4 Pedido

1. Completar departamento, ciudad, dirección y barrio.
2. Elegir PSE o tarjeta simulada.
3. Revisar cantidades y total.
4. Pulsar **Confirmar pedido** una sola vez.
5. Comprobar el mensaje de éxito.
6. Verificar el pedido en la cuenta.
7. Comprobar que el inventario se redujo.

## 14. Uso administrativo

1. El usuario debe existir en Supabase Auth.
2. Su fila en `profiles` debe estar activa.
3. El rol debe permitir acceso administrativo.
4. Abrir `administracion.html`.
5. Comprobar productos, ventas, usuarios e inventario.

Las modificaciones del catálogo se sincronizan con Supabase. Antes de una demostración se recomienda utilizar productos de prueba y registrar el inventario inicial.

## 15. Publicación en Cloudflare Pages

Configuración recomendada:

| Campo | Valor |
|---|---|
| Repositorio | `zapataosorio17/Ventech` |
| Rama | `main` |
| Framework | Ninguno / sitio estático |
| Comando de compilación | Vacío |
| Directorio de salida | Raíz del repositorio |
| Archivo inicial | `index.html` |

Flujo de publicación:

```text
Cambio local → pruebas → commit → push a main → GitHub Actions → Cloudflare Pages
```

Después de publicar se deben comprobar:

- `/`;
- `/main.css`;
- `/app.js`;
- `/sql-sync.js`;
- `/auth.html`;
- `/mi-cuenta.html`;
- `/administracion.html`.

Todos deben responder HTTP 200. `_headers` evita que el navegador conserve HTML obsoleto y permite cachear recursos versionados.

## 16. Pruebas

### 16.1 Prueba automática del frontend

```powershell
node tests/smoke.mjs
```

Valida que las páginas principales y sus recursos existan.

### 16.2 Sintaxis JavaScript

```powershell
node --check app.js
node --check admin-panel.js
node --check customer.js
node --check dashboard-analitico.js
node --check promotion.js
node --check sql-sync.js
```

### 16.3 Backend

```powershell
dotnet build Backend/Ventech.Api.csproj
```

### 16.4 Casos mínimos de aceptación

| Caso | Resultado esperado |
|---|---|
| Cargar inicio | Diseño y catálogo visibles |
| Buscar producto | Lista filtrada |
| Agregar al carrito | Contador y total actualizados |
| Registro | Usuario creado o correo de confirmación enviado |
| Login válido | Acceso a cuenta |
| Login inválido | Mensaje controlado |
| Compra con stock | Pedido creado y stock reducido |
| Compra sin stock | Rechazo sin pedido parcial |
| Usuario no administrador | Acceso administrativo bloqueado |
| Smoke test | Finaliza con código 0 |
| Build .NET | 0 errores |

## 17. Guion sugerido para una exposición

Duración aproximada: 10 a 15 minutos.

1. **Contexto (1 minuto):** explicar problema, usuarios y alcance académico.
2. **Arquitectura (2 minutos):** mostrar Cloudflare, Supabase y API local.
3. **Cliente (3 minutos):** catálogo, filtros, detalle y carrito.
4. **Cuenta y compra (3 minutos):** autenticación, dirección, simulación de pago y pedido.
5. **Administración (2 minutos):** producto, stock y ventas.
6. **Datos (2 minutos):** tablas, transacción e inventario.
7. **Calidad (1 minuto):** GitHub Actions, smoke test y build.
8. **Cierre (1 minuto):** limitaciones y mejoras futuras.

## 18. Evidencias para entregar

Se recomienda incluir capturas o video de:

- repositorio y último commit;
- GitHub Actions en verde;
- despliegue exitoso de Cloudflare;
- página principal con estilos;
- catálogo con productos de Supabase;
- registro o login;
- carrito y checkout;
- pedido creado;
- inventario antes y después;
- panel administrativo;
- SQL Server y endpoint `/api/health`;
- compilación del backend;
- dashboard o Power BI;
- documentación dentro del repositorio.

No deben aparecer contraseñas, tokens, claves secretas ni información personal innecesaria en las evidencias.

## 19. Solución de problemas

### Página sin estilos

- comprobar que `main.css` responde 200;
- verificar que Cloudflare desplegó el último commit de `main`;
- usar `Ctrl + F5`;
- revisar mayúsculas y minúsculas en nombres de archivo.

### `Failed to fetch`

- confirmar si la página intenta llamar a `localhost` desde Internet;
- revisar CORS;
- comprobar disponibilidad de Supabase;
- revisar consola y red del navegador.

### Error de restricción `orders_status_check`

- ejecutar la versión actual de `11_supabase_checkout.sql`;
- para una instalación antigua puede utilizarse `12_hotfix_order_status.sql`.

### Error `order_items.product_name` nulo

- ejecutar la versión actual de `11_supabase_checkout.sql`;
- para una instalación antigua puede utilizarse `13_hotfix_order_item_name.sql`.

### Error `email rate limit exceeded`

El proveedor de correo integrado de Supabase es únicamente para pruebas y permite muy pocos mensajes por hora. Se debe esperar a que el límite se restablezca o configurar SMTP propio en **Authentication → Emails → SMTP Settings**. Después de configurar SMTP se puede revisar **Authentication → Rate Limits**. La aplicación bloquea solicitudes repetidas durante 60 segundos, pero no puede eliminar el límite impuesto por el proveedor.

El límite se comparte entre recuperación, confirmación de registro y demás correos de autenticación. Para una demostración académica sin correo se puede desactivar temporalmente **Confirm email** en **Authentication → Sign In / Providers → Email**. Esto permite crear cuentas nuevas sin enviar confirmación, pero reduce la seguridad y no se recomienda para producción.

### Producto mostrado como `$0`

- recargar después de que el catálogo termine de sincronizar;
- comprobar `sql-sync.js`;
- verificar que el producto del carrito todavía existe en Supabase.

### Una cuenta nueva muestra pedidos de otra cuenta

Las versiones actuales guardan la caché de pedidos con una clave separada por ID de usuario y reconstruyen el historial desde Supabase usando `customer_id`. Después de actualizar, recarga `mi-cuenta.html`; la caché global antigua `vt_orders` se elimina únicamente cuando la sincronización remota termina correctamente.

### Backend no inicia

- revisar `appsettings.json`;
- comprobar que SQL Server está iniciado;
- comprobar el nombre del servidor y la base;
- cerrar una instancia duplicada que ya use el puerto 5097.

### El ejecutable está bloqueado al compilar

La API ya está ejecutándose. Detenerla antes de compilar o compilar hacia una carpeta de salida diferente.

## 20. Seguridad y privacidad

- mantener secretos fuera del repositorio;
- utilizar variables de entorno o gestores de secretos;
- aplicar mínimo privilegio;
- revisar RLS después de cada tabla nueva;
- no almacenar contraseñas en texto plano;
- usar HTTPS;
- validar en servidor cantidades, precios y stock;
- registrar actividad administrativa;
- realizar copias de seguridad;
- revisar dependencias y alertas de seguridad.

## 21. Limitaciones académicas

- pagos simulados;
- no hay transportadora real;
- no se generan documentos tributarios oficiales;
- no existe conciliación bancaria;
- algunas funciones históricas dependen de SQL Server local;
- se requieren pruebas adicionales antes de uso comercial.

## 22. Mejoras futuras

- unificar definitivamente el backend en Supabase o una API desplegada;
- migrar funciones administrativas restantes que dependan de localhost;
- agregar pruebas end-to-end;
- integrar almacenamiento de imágenes;
- incorporar observabilidad y alertas;
- implementar recuperación completa de contraseña;
- integrar pasarela de pagos certificada;
- automatizar migraciones y copias de seguridad;
- añadir accesibilidad WCAG y pruebas móviles.

## 23. Lista de verificación final

- [ ] Repositorio limpio y actualizado.
- [ ] No existen secretos versionados.
- [ ] `node tests/smoke.mjs` pasa.
- [ ] Backend compila sin errores.
- [ ] GitHub Actions termina correctamente.
- [ ] Cloudflare despliega el último commit.
- [ ] Recursos principales responden 200.
- [ ] Catálogo carga desde Supabase.
- [ ] Registro e inicio de sesión funcionan.
- [ ] Compra de prueba funciona.
- [ ] Inventario se descuenta correctamente.
- [ ] Acceso administrativo está restringido.
- [ ] Evidencias no muestran datos sensibles.
- [ ] Manual y README están publicados.

## 24. Conclusión

Ventech presenta un ciclo académico completo: interfaz, lógica de negocio, autenticación, persistencia, inventario, API, analítica, publicación, pruebas y documentación. Para una entrega sólida se debe demostrar tanto el resultado visible como la trazabilidad técnica que conecta cada acción del usuario con sus datos y validaciones.
