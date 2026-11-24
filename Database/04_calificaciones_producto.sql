USE Ventech;
GO

IF OBJECT_ID('vt.CalificacionesProducto', 'U') IS NULL
BEGIN
    CREATE TABLE vt.CalificacionesProducto (
        CalificacionId BIGINT IDENTITY(1,1) PRIMARY KEY,
        ProductoId INT NOT NULL,
        UsuarioId INT NOT NULL,
        Puntuacion TINYINT NOT NULL,
        Comentario NVARCHAR(500) NULL,
        FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Calificaciones_FechaCreacion DEFAULT SYSDATETIME(),
        FechaActualizacion DATETIME2 NULL,
        CONSTRAINT CK_Calificaciones_Puntuacion CHECK (Puntuacion BETWEEN 1 AND 5),
        CONSTRAINT UQ_Calificaciones_ProductoUsuario UNIQUE (ProductoId, UsuarioId),
        CONSTRAINT FK_Calificaciones_Producto FOREIGN KEY (ProductoId) REFERENCES vt.Productos(ProductoId),
        CONSTRAINT FK_Calificaciones_Usuario FOREIGN KEY (UsuarioId) REFERENCES vt.Usuarios(UsuarioId)
    );
    CREATE INDEX IX_CalificacionesProducto_ProductoId ON vt.CalificacionesProducto(ProductoId);
END
GO