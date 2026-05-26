# Plan de Testing - Sistema de Pagos

## 🧪 Testing Manual

### Fase 1: Frontend - Vista de Pagos

#### Test 1.1: Acceso a la vista
- [ ] Abrir la aplicación
- [ ] En sidebar, hacer clic en "Pagos"
- [ ] Verificar que carga la página sin errores

**Resultado esperado**: Se muestra el mensaje "No hay productos vendidos para pagar" (si no hay ventas)

#### Test 1.2: Mostrar tabla de pagos
- [ ] Cargar una venta con productos
- [ ] Ir a vista de "Pagos"
- [ ] Verificar tabla con:
  - Nombre de proveedora
  - Cantidad de productos
  - Total a pagar (60% del precio)
  - Estado (Pendiente)

**Resultado esperado**: Tabla con datos correctos

#### Test 1.3: Expandir detalles
- [ ] Hacer clic en "Ver detalles"
- [ ] Verificar que se expande mostrando:
  - Código del producto
  - Descripción
  - Precio sugerido
  - Valor para proveedora (60%)

**Resultado esperado**: Tabla interna expandida correctamente

#### Test 1.4: Agrupar por proveedora
- [ ] Cargar venta con productos de diferentes proveedoras
- [ ] Ir a "Pagos"
- [ ] Verificar que cada proveedora tenga su fila

**Resultado esperado**: Cada proveedora separada con sus totales

---

### Fase 2: Modal de Pago

#### Test 2.1: Abrir modal
- [ ] En tabla de pagos, hacer clic en "Registrar pago"
- [ ] Verificar que se abre modal

**Resultado esperado**: Modal se abre sin errores

#### Test 2.2: Contenido de modal
- [ ] Verificar que muestra:
  - Nombre de proveedora en header
  - Cantidad de productos vendidos
  - Tabla con productos
  - Valor para cada producto
  - Total a transferir

**Resultado esperado**: Todos los datos mostrados correctamente

#### Test 2.3: Vista previa de mensaje
- [ ] Verificar mensaje preformulado
- [ ] Para 1 producto: "Hola, se vendió este de la lista: [producto]"
- [ ] Para múltiples: "Hola, se vendieron estos de la lista: [producto1], [producto2]"

**Resultado esperado**: Mensaje correcto según cantidad

---

### Fase 3: WhatsApp (Simulado)

#### Test 3.1: Error - sin teléfono
- [ ] Proveedora sin teléfono
- [ ] Hacer clic "Enviar por WhatsApp"
- [ ] Verificar mensaje de error

**Resultado esperado**: Mensaje: "No hay número de teléfono para esta proveedora"

#### Test 3.2: Envío simulado
- [ ] Proveedora CON teléfono
- [ ] Hacer clic "Enviar por WhatsApp"
- [ ] Verificar respuesta exitosa

**Resultado esperado**: 
- Mensaje de confirmación "Mensaje enviado por WhatsApp"
- En backend logs: registro del envío

#### Test 3.3: Validación de teléfono
- [ ] Probar con diferentes formatos:
  - +5491123456789 ✓
  - 5491123456789 ✓
  - 91123456789 ✓ (asume Argentina)
  - 1123456789 ✓
  - 123 ✗ (debe fallar)

**Resultado esperado**: Acepta formatos válidos, rechaza inválidos

---

### Fase 4: Mercado Pago (Link de redirección)

#### Test 4.1: Error - sin alias/CBU
- [ ] Proveedora sin alias y sin CBU
- [ ] Hacer clic "Transferir en Mercado Pago"
- [ ] Verificar mensaje de error

**Resultado esperado**: "No hay alias o CBU cargado para esta proveedora"

#### Test 4.2: Con alias
- [ ] Proveedora con alias (ej: "miempresa.mp")
- [ ] Hacer clic "Transferir en Mercado Pago"
- [ ] Verificar que abre URL en nueva pestaña

**Resultado esperado**: Se abre Mercado Pago con los parámetros

#### Test 4.3: Con CBU
- [ ] Proveedora con CBU válido (22 dígitos)
- [ ] Hacer clic "Transferir en Mercado Pago"
- [ ] Verificar que abre URL con CBU

**Resultado esperado**: URL generada correctamente con CBU

#### Test 4.4: Validación de CBU
- [ ] Probar CBU válido: 1234567890123456789012 ✓
- [ ] Probar CBU inválido: 123 ✗

**Resultado esperado**: Acepta 22 dígitos, rechaza otros

#### Test 4.5: Validación de alias
- [ ] Probar alias válido: "miempresa.mp" ✓
- [ ] Probar alias válido: "empresa-2024" ✓
- [ ] Probar alias inválido: "abc" ✗ (muy corto)
- [ ] Probar alias inválido: "empresa@123.mp" ✗ (caracteres no permitidos)

**Resultado esperado**: Valida correctamente

---

### Fase 5: Cálculos

#### Test 5.1: Cálculo de precio para proveedora
- [ ] Producto con precio sugerido: $100
- [ ] Valor para proveedora: $60 (60%)
- [ ] Verificar en tabla

**Resultado esperado**: 100 × 0.6 = $60

#### Test 5.2: Total por proveedora
- [ ] 3 productos: $100, $80, $120
- [ ] Totales: $60, $48, $72
- [ ] Total general: $180
- [ ] Verificar en tabla

**Resultado esperado**: Suma correcta de valores

#### Test 5.3: Formateo de moneda
- [ ] Verificar que muestra: $ 100,00
- [ ] Verificar que muestra: $ 1.234,56 (con punto de miles)
- [ ] Verificar que usa 2 decimales

**Resultado esperado**: Formato correcto para Argentina

---

### Fase 6: Filtrado y búsqueda

#### Test 6.1: Filtro por proveedora
- [ ] Usar SearchBar para filtrar por nombre
- [ ] Verificar que tabla se actualiza

**Resultado esperado**: Solo muestra proveedoras coincidentes

#### Test 6.2: Sin resultados
- [ ] Buscar término inexistente
- [ ] Verificar mensaje "No hay productos vendidos para pagar"

**Resultado esperado**: Mensaje apropiado

---

### Fase 7: Flujo completo

#### Test 7.1: Flujo E2E
1. [ ] Crear inventario con 2 productos de Proveedor A
2. [ ] Crear inventario con 1 producto de Proveedor B
3. [ ] Cargar venta con 1 producto de Proveedor A
4. [ ] Ir a "Pagos"
5. [ ] Verificar que solo muestra Proveedor A
6. [ ] Expandir detalles
7. [ ] Hacer clic "Registrar pago"
8. [ ] Hacer clic "Enviar por WhatsApp" (verificar en logs)
9. [ ] Cerrar modal
10. [ ] Cargar otra venta con productos de Proveedor B
11. [ ] Ir a "Pagos"
12. [ ] Verificar que muestra ambos proveedores

**Resultado esperado**: Todos los pasos funcionan sin errores

---

## 🔧 Testing técnico

### Backend

#### Test B1: Endpoint WhatsApp
```bash
curl -X POST http://localhost:3001/inventory/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5491123456789",
    "message": "Test",
    "items": []
  }'
```

**Resultado esperado**: 
```json
{
  "success": true,
  "message": "Mensaje de WhatsApp enviado exitosamente",
  "phoneNumber": "5491123456789",
  "timestamp": "..."
}
```

#### Test B2: Endpoint Mercado Pago
```bash
curl -X POST http://localhost:3001/inventory/mercadopago/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "test.mp",
    "amount": 100,
    "proveedora": "Test"
  }'
```

**Resultado esperado**: 
```json
{
  "success": true,
  "redirectUrl": "https://...",
  "message": "Transferencia de $100 a Test",
  "timestamp": "..."
}
```

#### Test B3: Validación de teléfono
- Función: `isValidPhoneNumber()`
- Probar: "5491123456789" → true
- Probar: "123" → false

#### Test B4: Validación de CBU
- Función: `isValidCBU()`
- Probar: "1234567890123456789012" → true
- Probar: "123" → false

---

## 📋 Checklist de validación

- [ ] Frontend se carga sin errores
- [ ] Tabla de pagos muestra datos correctamente
- [ ] Modal de pago funciona
- [ ] Mensajes de error están claros
- [ ] Mensajes de WhatsApp se generan correctamente
- [ ] URLs de Mercado Pago se generan correctamente
- [ ] Cálculos de precios son exactos
- [ ] Formateo de moneda es correcto
- [ ] Búsqueda/filtro funciona
- [ ] Flujo E2E completo funciona
- [ ] No hay errores en consola
- [ ] No hay errores en backend logs

---

## 🐛 Bugs conocidos / To-Do

- [ ] Integración real con Twilio (ahora es simulado)
- [ ] Integración real con Mercado Pago API
- [ ] Guardar estado de "Pagado" en base de datos
- [ ] Confirmación después de pagar
- [ ] Historial de pagos
- [ ] Notificaciones por email

---

Generated: 2026-05-24
