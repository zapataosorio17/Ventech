USE Ventech;
GO

IF OBJECT_ID('vt.PedidosCancelados', 'U') IS NULL
BEGIN
    CREATE TABLE vt.PedidosCancelados
    (
        CancelacionId BIGINT IDENTITY(1,1) PRIMARY KEY,
        PedidoId BIGINT NOT NULL,
        UsuarioId INT NOT NULL,
        NumeroPedido NVARCHAR(30) NOT NULL,
        Motivo NVARCHAR(500) NOT NULL CONSTRAINT DF_PedidosCancelados_Motivo DEFAULT ('Cancelado por el cliente'),
        EstadoAnterior NVARCHAR(20) NOT NULL,
        Total DECIMAL(18,2) NOT NULL,
        FechaPedido DATETIME2 NOT NULL,
        FechaCancelacion DATETIME2 NOT NULL CONSTRAINT DF_PedidosCancelados_Fecha DEFAULT (SYSDATETIME()),
        CONSTRAINT UQ_PedidosCancelados_Pedido UNIQUE (PedidoId),
        CONSTRAINT FK_PedidosCancelados_Pedido FOREIGN KEY (PedidoId) REFERENCES vt.Pedidos(PedidoId),
        CONSTRAINT FK_PedidosCancelados_Usuario FOREIGN KEY (UsuarioId) REFERENCES vt.Usuarios(UsuarioId)
    );

    CREATE INDEX IX_PedidosCancelados_Fecha ON vt.PedidosCancelados(FechaCancelacion DESC);
END;
GO
