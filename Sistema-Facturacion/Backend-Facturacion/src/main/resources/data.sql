-- Usuario Base (ID 1)
INSERT IGNORE INTO usuario (id, apellido, clave, nombre, usuario) VALUES (1, 'Sosa', '1234', 'Florencia', 'flor');

-- Datos Maestros Básicos (IDs 1)
INSERT IGNORE INTO domicilio (id, nombre_calle, numero_calle) VALUES (1, 'Av. San Martin', '1000');
INSERT IGNORE INTO contacto (id, celular, email, telefono) VALUES (1, '261000000', 'flor@test.com', '4440000');
INSERT IGNORE INTO cliente (id, fecha_alta, fecha_modificacion, cuit_cuil, denominacion, usuario_carga_id, usuario_modificacion_id, contacto_id, domicilio_id) VALUES (1, NOW(), NOW(), '27-12345678-9', 'Cliente Final', 1, 1, 1, 1);
INSERT IGNORE INTO condicion_iva (id, fecha_alta, fecha_modificacion, codigo_afip, denominacion, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 1, 'Responsable Inscripto', 1, 1);
INSERT IGNORE INTO condicion_iva (id, fecha_alta, fecha_modificacion, codigo_afip, denominacion, usuario_carga_id, usuario_modificacion_id) VALUES (2, NOW(), NOW(), 3, 'Consumidor Final', 1, 1);
INSERT IGNORE INTO tipo_moneda (id, fecha_alta, fecha_modificacion, codigo_afip, denominacion, simbolo, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 'PES', 'Pesos Argentinos', '$', 1, 1);
INSERT IGNORE INTO tipo_moneda (id, fecha_alta, fecha_modificacion, codigo_afip, denominacion, simbolo, usuario_carga_id, usuario_modificacion_id) VALUES (2, NOW(), NOW(), 'DOL', 'Dólares', 'USD', 1, 1);
INSERT IGNORE INTO punto_venta (id, fecha_alta, fecha_modificacion, descripcion, domicilio_comercial, numero, tipo_emision, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 'Casa Central Mendoza', 'San Martin 1000', 1, 'Electronica', 1, 1);
INSERT IGNORE INTO marca (id, fecha_alta, fecha_modificacion, codigo, denominacion, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 1, 'Generica', 1, 1);
INSERT IGNORE INTO rubro (id, fecha_alta, fecha_modificacion, codigo, denominacion, usuario_carga_id, usuario_modificacion_id) VALUES (1, NOW(), NOW(), 1, 'Alimentos', 1, 1);
INSERT IGNORE INTO lista_precio (id, codigo, denominacion, fecha_alta, fecha_modificacion, usuario_carga_id, usuario_modificacion_id) VALUES (1, 'LPMIN', 'Lista Minorista', NOW(), NOW(), 1, 1);

-- Artículos
INSERT IGNORE INTO articulo (id, codigo, denominacion, fecha_alta, fecha_modificacion, marca_id, rubro_id, usuario_carga_id, usuario_modificacion_id) VALUES
                                                                                                                                                          (1, 'ART001', 'Arroz Blanco 1kg', NOW(), NOW(), 1, 1, 1, 1),
                                                                                                                                                          (2, 'ART002', 'Fideos Tallarines 500g', NOW(), NOW(), 1, 1, 1, 1),
                                                                                                                                                          (3, 'ART003', 'Aceite de Girasol 1.5L', NOW(), NOW(), 1, 1, 1, 1),
                                                                                                                                                          (4, 'ART004', 'Yerba Mate 1kg', NOW(), NOW(), 1, 1, 1, 1);

-- Precios (Estos IDs 1, 2, 3, 4 son los que envía el frontend al guardar)
INSERT IGNORE INTO lista_precio_articulo (id, articulo_id, lista_precio_id, precio_venta, fecha_alta, fecha_modificacion, usuario_carga_id, usuario_modificacion_id) VALUES
                                                                                                                                                                         (1, 1, 1, 1500.0, NOW(), NOW(), 1, 1),
                                                                                                                                                                         (2, 2, 1, 900.0, NOW(), NOW(), 1, 1),
                                                                                                                                                                         (3, 3, 1, 2200.0, NOW(), NOW(), 1, 1),
                                                                                                                                                                         (4, 4, 1, 3500.0, NOW(), NOW(), 1, 1),
                                                                                                                                                                         (6, 1, 1, 1200.0, NOW(), NOW(), 1, 1); -- El ID 6 que pediste para el arroz mayorista                                                                                                                                                                       (10, 5, 2, 900.0, NOW(), NOW(), 1, 1);