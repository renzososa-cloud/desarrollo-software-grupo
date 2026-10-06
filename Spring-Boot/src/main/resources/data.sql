-- Usuario
INSERT IGNORE INTO usuario (id, apellido, clave, nombre, usuario) VALUES (1, 'Perez', '1234', 'Juan', 'jperez');

-- Domicilio
INSERT IGNORE INTO domicilio (id, nombre_calle, numero_calle) VALUES (1, 'Av. Falsa', '123');

-- Contacto
INSERT IGNORE INTO contacto (id, celular, email, telefono) VALUES (1, '1122334455', 'juan@perez.com', '44445555');

-- Cliente
INSERT IGNORE INTO cliente (id, fecha_alta, fecha_modificacion, cuit_cuil, denominacion, usuario_carga_id, usuario_modificacion_id, contacto_id, domicilio_id) VALUES (1, NOW(), NOW(), '20-12345678-9', 'Juan Perez SA', 1, 1, 1, 1);

-- Condicion IVA
INSERT IGNORE INTO condicion_iva (id, fecha_alta, fecha_modificacion, codigo_afip, denominacion, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 1, 'Responsable Inscripto', 1, 1);

-- Tipo Moneda
INSERT IGNORE INTO tipo_moneda (id, fecha_alta, fecha_modificacion, codigo_afip, denominacion, simbolo, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 'PES', 'Pesos Argentinos', '$', 1, 1);

-- Punto Venta
INSERT IGNORE INTO punto_venta (id, fecha_alta, fecha_modificacion, descripcion, domicilio_comercial, numero, tipo_emision, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 'Sede Central', 'Av. Falsa 123', 1, 'Electronica', 1, 1);

-- Factura Venta
INSERT IGNORE INTO factura_venta (id, fecha_alta, fecha_modificacion, estado, fecha_emision, importe_cobrado, importe_saldo, importe_total, numero, usuario_carga_id, usuario_modificacion_id, cliente_id, condicion_iva_id, moneda_id, punto_venta_id) VALUES (1, NOW(), NOW(), 'APROBADA', '2024-01-01', 1000.0, 0.0, 1000.0, 1, 1, 1, 1, 1, 1, 1);
INSERT IGNORE INTO factura_venta (id, fecha_alta, fecha_modificacion, estado, fecha_emision, importe_cobrado, importe_saldo, importe_total, numero, usuario_carga_id, usuario_modificacion_id, cliente_id, condicion_iva_id, moneda_id, punto_venta_id) VALUES (2, NOW(), NOW(), 'PENDIENTE', '2024-02-15', 500.0, 500.0, 1000.0, 2, 1, 1, 1, 1, 1, 1);

-- Marca, Rubro, Articulo, Lista de Precio para Detalle
INSERT IGNORE INTO marca (id, fecha_alta, fecha_modificacion, codigo, denominacion, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 1, 'Acme', 1, 1);
INSERT IGNORE INTO rubro (id, fecha_alta, fecha_modificacion, codigo, denominacion, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 1, 'Herramientas', 1, 1);
INSERT IGNORE INTO articulo (id, fecha_alta, fecha_modificacion, codigo, denominacion, usuario_carga_id, usuario_modificacion_id, marca_id, rubro_id) VALUES (1, NOW(), NOW(), 'A001', 'Martillo', 1, 1, 1, 1);
INSERT IGNORE INTO lista_precio (id, fecha_alta, fecha_modificacion, codigo, denominacion, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 'L001', 'Lista Base', 1, 1);
INSERT IGNORE INTO lista_precio_articulo (id, fecha_alta, fecha_modificacion, precio_venta, usuario_carga_id, usuario_modificacion_id, articulo_id, lista_precio_id) VALUES (1, NOW(), NOW(), 1000.0, 1, 1, 1, 1);

-- Factura Venta Detalle
INSERT IGNORE INTO factura_venta_detalle (id, cantidad, descripcion, importe_iva, importe_neto, importe_subtotal, porcentaje_bonificacion, precio_unitario, factura_id, lista_precio_articulo_id) VALUES (1, 1, 'Martillo', 210.0, 1000.0, 1210.0, 0, 1000.0, 1, 1);
INSERT IGNORE INTO factura_venta_detalle (id, cantidad, descripcion, importe_iva, importe_neto, importe_subtotal, porcentaje_bonificacion, precio_unitario, factura_id, lista_precio_articulo_id) VALUES (2, 1, 'Martillo', 210.0, 1000.0, 1210.0, 0, 1000.0, 2, 1);
