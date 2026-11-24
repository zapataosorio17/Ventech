/* Capacidad y colores disponibles para productos */
USE Ventech;
GO
IF COL_LENGTH('vt.Productos', 'Capacidad') IS NULL
    ALTER TABLE vt.Productos ADD Capacidad NVARCHAR(120) NULL;
GO
IF COL_LENGTH('vt.Productos', 'ColoresDisponibles') IS NULL
    ALTER TABLE vt.Productos ADD ColoresDisponibles NVARCHAR(300) NULL;
GO