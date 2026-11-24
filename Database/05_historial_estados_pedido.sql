/* Historial de cambios de estado de pedidos - Ventech */
USE Ventech;
GO

IF OBJECT_ID('vt.HistorialEstadosPedido', 'U') IS NULL
BEGIN
    CREATE TABLE vt.HistorialEstadosPedido
    (
        HistorialEstadoId BIGINT IDENTITY(1,1) PRIMARY KEY,
        PedidoId          BIGINT NOT NULL,
        EstadoAnterior    NVARCHAR(20) NULL,
        EstadoNuevo       NVARCHAR(20) NOT NULL,
        Responsable       NVARCHAR(160) NULL,
        Observacion       NVARCHAR(500) NULL,
        FechaCambio       DATETIME2 NOT NULL CONSTRAINT DF_HistorialEstadosPedido_Fecha DEFAULT (SYSDATETIME()),
        CONSTRAINT CK_HistorialEstadosPedido_Estado CHECK (EstadoNuevo IN ('Procesando', 'En camino', 'Entregado', 'Cancelado')),
        CONSTRAINT FK_HistorialEstadosPedido_Pedido FOREIGN KEY (PedidoId) REFERENCES vt.Pedidos(PedidoId)
    );
    CREATE INDEX IX_HistorialEstadosPedido_Pedido_Fecha
        ON vt.HistorialEstadosPedido(PedidoId, FechaCambio DESC);
END
GO

/* Crea el primer registro para los pedidos existentes, sin duplicarlos. */
INSERT INTO vt.HistorialEstadosPedido(PedidoId, EstadoAnterior, EstadoNuevo, Responsable, Observacion)
SELECT p.PedidoId, NULL, p.Estado, 'Sistema', 'Estado inicial del pedido'
FROM vt.Pedidos p
WHERE NOT EXISTS (
    SELECT 1 FROM vt.HistorialEstadosPedido h WHERE h.PedidoId = p.PedidoId
);
GO