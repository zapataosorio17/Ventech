/*
  Ventech - esquema inicial para Microsoft SQL Server
  Ejecutar dentro de la base de datos: Ventech
*/
USE Ventech;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'vt')
    EXEC('CREATE SCHEMA vt');
GO

CREATE TABLE vt.Roles (
    RolId           INT IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(40) NOT NULL UNIQUE,
    Descripcion     NVARCHAR(200) NULL
);
GO

CREATE TABLE vt.Usuarios (
    UsuarioId       INT IDENTITY(1,1) PRIMARY KEY,
    Nombres         NVARCHAR(100) NOT NULL,
    Apellidos       NVARCHAR(100) NULL,
    Documento       NVARCHAR(30) NULL UNIQUE,
    Telefono        NVARCHAR(30) NULL,
    Correo          NVARCHAR(160) NOT NULL UNIQUE,
    PasswordHash    NVARCHAR(255) NOT NULL,
    FotoUrl         NVARCHAR(500) NULL,
    Direccion       NVARCHAR(250) NULL,
    Departamento    NVARCHAR(100) NULL,
    Ciudad          NVARCHAR(100) NULL,
    Barrio          NVARCHAR(100) NULL,
    Activo          BIT NOT NULL CONSTRAINT DF_Usuarios_Activo DEFAULT 1,
    FechaCreacion   DATETIME2 NOT NULL CONSTRAINT DF_Usuarios_Fecha DEFAULT SYSDATETIME(),
    UltimoAcceso    DATETIME2 NULL
);
GO

CREATE TABLE vt.UsuarioRoles (
    UsuarioId       INT NOT NULL,
    RolId           INT NOT NULL,
    PRIMARY KEY (UsuarioId, RolId),
    CONSTRAINT FK_UsuarioRoles_Usuario FOREIGN KEY (UsuarioId) REFERENCES vt.Usuarios(UsuarioId),
    CONSTRAINT FK_UsuarioRoles_Rol FOREIGN KEY (RolId) REFERENCES vt.Roles(RolId)
);
GO

CREATE TABLE vt.Categorias (
    CategoriaId     INT IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion     NVARCHAR(250) NULL,
    Activa          BIT NOT NULL CONSTRAINT DF_Categorias_Activa DEFAULT 1
);
GO

CREATE TABLE vt.Productos (
    ProductoId          INT IDENTITY(1,1) PRIMARY KEY,
    Codigo              NVARCHAR(50) NOT NULL UNIQUE,
    Nombre              NVARCHAR(180) NOT NULL,
    CategoriaId         INT NOT NULL,
    Descripcion         NVARCHAR(MAX) NULL,
    Especificaciones    NVARCHAR(MAX) NULL,
    Precio              DECIMAL(18,2) NOT NULL,
    DescuentoPorcentaje DECIMAL(5,2) NOT NULL CONSTRAINT DF_Productos_Descuento DEFAULT 0,
    IVAPorcentaje       DECIMAL(5,2) NOT NULL CONSTRAINT DF_Productos_IVA DEFAULT 19,
    StockActual         INT NOT NULL CONSTRAINT DF_Productos_Stock DEFAULT 0,
    StockMinimo         INT NOT NULL CONSTRAINT DF_Productos_StockMin DEFAULT 5,
    Estado              NVARCHAR(20) NOT NULL CONSTRAINT DF_Productos_Estado DEFAULT 'Activo',
    Destacado           BIT NOT NULL CONSTRAINT DF_Productos_Destacado DEFAULT 0,
    FechaCreacion       DATETIME2 NOT NULL CONSTRAINT DF_Productos_Fecha DEFAULT SYSDATETIME(),
    FechaActualizacion  DATETIME2 NULL,
    CONSTRAINT CK_Productos_Precio CHECK (Precio >= 0),
    CONSTRAINT CK_Productos_Descuento CHECK (DescuentoPorcentaje BETWEEN 0 AND 99),
    CONSTRAINT CK_Productos_IVA CHECK (IVAPorcentaje BETWEEN 0 AND 100),
    CONSTRAINT CK_Productos_Stock CHECK (StockActual >= 0),
    CONSTRAINT CK_Productos_Estado CHECK (Estado IN ('Activo', 'Inhabilitado')),
    CONSTRAINT FK_Productos_Categoria FOREIGN KEY (CategoriaId) REFERENCES vt.Categorias(CategoriaId)
);
GO

CREATE TABLE vt.ProductoImagenes (
    ImagenId        INT IDENTITY(1,1) PRIMARY KEY,
    ProductoId      INT NOT NULL,
    RutaImagen      NVARCHAR(500) NOT NULL,
    EsPrincipal     BIT NOT NULL CONSTRAINT DF_ProductoImagenes_Principal DEFAULT 0,
    Orden           INT NOT NULL CONSTRAINT DF_ProductoImagenes_Orden DEFAULT 1,
    CONSTRAINT FK_ProductoImagenes_Producto FOREIGN KEY (ProductoId) REFERENCES vt.Productos(ProductoId)
);
GO

CREATE TABLE vt.MovimientosInventario (
    MovimientoId    INT IDENTITY(1,1) PRIMARY KEY,
    ProductoId      INT NOT NULL,
    UsuarioId       INT NULL,
    Tipo            NVARCHAR(20) NOT NULL,
    Cantidad        INT NOT NULL,
    StockAnterior   INT NOT NULL,
    StockPosterior  INT NOT NULL,
    Observacion     NVARCHAR(300) NULL,
    Fecha           DATETIME2 NOT NULL CONSTRAINT DF_MovimientosInventario_Fecha DEFAULT SYSDATETIME(),
    CONSTRAINT CK_MovimientosInventario_Tipo CHECK (Tipo IN ('Entrada', 'Venta', 'Ajuste', 'Cancelacion')),
    CONSTRAINT FK_MovimientosInventario_Producto FOREIGN KEY (ProductoId) REFERENCES vt.Productos(ProductoId),
    CONSTRAINT FK_MovimientosInventario_Usuario FOREIGN KEY (UsuarioId) REFERENCES vt.Usuarios(UsuarioId)
);
GO

CREATE TABLE vt.Pedidos (
    PedidoId        BIGINT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId       INT NOT NULL,
    NumeroPedido    NVARCHAR(30) NOT NULL UNIQUE,
    Estado          NVARCHAR(20) NOT NULL CONSTRAINT DF_Pedidos_Estado DEFAULT 'Procesando',
    TipoEntrega     NVARCHAR(20) NOT NULL CONSTRAINT DF_Pedidos_Entrega DEFAULT 'Domicilio',
    Departamento    NVARCHAR(100) NULL,
    Ciudad          NVARCHAR(100) NULL,
    Direccion       NVARCHAR(250) NULL,
    Barrio          NVARCHAR(100) NULL,
    Subtotal        DECIMAL(18,2) NOT NULL CONSTRAINT DF_Pedidos_Subtotal DEFAULT 0,
    Descuento       DECIMAL(18,2) NOT NULL CONSTRAINT DF_Pedidos_Descuento DEFAULT 0,
    IVA             DECIMAL(18,2) NOT NULL CONSTRAINT DF_Pedidos_IVA DEFAULT 0,
    CostoEnvio      DECIMAL(18,2) NOT NULL CONSTRAINT DF_Pedidos_Envio DEFAULT 0,
    Total           DECIMAL(18,2) NOT NULL CONSTRAINT DF_Pedidos_Total DEFAULT 0,
    FechaPedido     DATETIME2 NOT NULL CONSTRAINT DF_Pedidos_Fecha DEFAULT SYSDATETIME(),
    FechaActualizacion DATETIME2 NULL,
    CONSTRAINT CK_Pedidos_Estado CHECK (Estado IN ('Procesando', 'En camino', 'Entregado', 'Cancelado')),
    CONSTRAINT FK_Pedidos_Usuario FOREIGN KEY (UsuarioId) REFERENCES vt.Usuarios(UsuarioId)
);
GO

CREATE TABLE vt.DetallePedidos (
    DetallePedidoId INT IDENTITY(1,1) PRIMARY KEY,
    PedidoId        BIGINT NOT NULL,
    ProductoId      INT NOT NULL,
    Cantidad        INT NOT NULL,
    PrecioUnitario  DECIMAL(18,2) NOT NULL,
    Descuento       DECIMAL(18,2) NOT NULL CONSTRAINT DF_DetallePedidos_Descuento DEFAULT 0,
    IVAPorcentaje   DECIMAL(5,2) NOT NULL,
    IVA             DECIMAL(18,2) NOT NULL,
    TotalLinea      DECIMAL(18,2) NOT NULL,
    CONSTRAINT CK_DetallePedidos_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT FK_DetallePedidos_Pedido FOREIGN KEY (PedidoId) REFERENCES vt.Pedidos(PedidoId),
    CONSTRAINT FK_DetallePedidos_Producto FOREIGN KEY (ProductoId) REFERENCES vt.Productos(ProductoId)
);
GO

CREATE TABLE vt.Pagos (
    PagoId          BIGINT IDENTITY(1,1) PRIMARY KEY,
    PedidoId        BIGINT NOT NULL,
    MetodoPago      NVARCHAR(30) NOT NULL,
    Estado          NVARCHAR(20) NOT NULL CONSTRAINT DF_Pagos_Estado DEFAULT 'Pendiente',
    Referencia      NVARCHAR(100) NULL,
    Valor           DECIMAL(18,2) NOT NULL,
    FechaPago       DATETIME2 NULL,
    CONSTRAINT CK_Pagos_Estado CHECK (Estado IN ('Pendiente', 'Aprobado', 'Rechazado', 'Reembolsado')),
    CONSTRAINT FK_Pagos_Pedido FOREIGN KEY (PedidoId) REFERENCES vt.Pedidos(PedidoId)
);
GO

CREATE TABLE vt.Facturas (
    FacturaId       BIGINT IDENTITY(1,1) PRIMARY KEY,
    PedidoId        BIGINT NOT NULL UNIQUE,
    NumeroFactura   NVARCHAR(30) NOT NULL UNIQUE,
    Estado          NVARCHAR(20) NOT NULL CONSTRAINT DF_Facturas_Estado DEFAULT 'Emitida',
    FechaEmision    DATETIME2 NOT NULL CONSTRAINT DF_Facturas_Fecha DEFAULT SYSDATETIME(),
    FechaAnulacion  DATETIME2 NULL,
    Observacion     NVARCHAR(500) NULL,
    CONSTRAINT CK_Facturas_Estado CHECK (Estado IN ('Emitida', 'Anulada')),
    CONSTRAINT FK_Facturas_Pedido FOREIGN KEY (PedidoId) REFERENCES vt.Pedidos(PedidoId)
);
GO

CREATE TABLE vt.SesionesEmpleados (
    SesionId        BIGINT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId       INT NOT NULL,
    InicioTurno     DATETIME2 NOT NULL CONSTRAINT DF_Sesiones_Inicio DEFAULT SYSDATETIME(),
    FinTurno        DATETIME2 NULL,
    CONSTRAINT FK_Sesiones_Usuario FOREIGN KEY (UsuarioId) REFERENCES vt.Usuarios(UsuarioId)
);
GO

CREATE TABLE vt.ActividadEmpleados (
    ActividadId     BIGINT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId       INT NOT NULL,
    Accion          NVARCHAR(150) NOT NULL,
    Detalle         NVARCHAR(500) NULL,
    Fecha           DATETIME2 NOT NULL CONSTRAINT DF_Actividad_Fecha DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Actividad_Usuario FOREIGN KEY (UsuarioId) REFERENCES vt.Usuarios(UsuarioId)
);
GO

CREATE INDEX IX_Productos_Categoria_Estado ON vt.Productos(CategoriaId, Estado);
CREATE INDEX IX_Pedidos_Usuario_Fecha ON vt.Pedidos(UsuarioId, FechaPedido DESC);
CREATE INDEX IX_Movimientos_Producto_Fecha ON vt.MovimientosInventario(ProductoId, Fecha DESC);
GO

IF NOT EXISTS (SELECT 1 FROM vt.Roles WHERE Nombre = 'Administrador')
BEGIN
    INSERT INTO vt.Roles (Nombre, Descripcion) VALUES
    ('Administrador', 'Control total del sistema'),
    ('Supervisor', 'Gestiona usuarios, inventario y reportes'),
    ('Empleado', 'Gestiona ventas e inventario autorizado'),
    ('Cliente', 'Compra y consulta pedidos');
END
GO
