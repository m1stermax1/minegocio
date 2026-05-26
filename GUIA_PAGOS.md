# Vista de Pagos a Proveedoras - Guía de uso

## ¿Qué es la vista de Pagos?

Es una nueva sección donde puedes gestionar los pagos a tus proveedoras basado en los productos que se vendieron.

## Flujo de uso

### 1. Cargar una venta
- Ve a "Ventas" → "Agregar venta"
- Selecciona productos del inventario
- Marca el método de pago (efectivo, transferencia, débito, crédito)
- Confirma

Los productos se marcan como "vendidos" automáticamente.

### 2. Ir a la vista de "Pagos"
- En el sidebar, haz clic en "Pagos"
- Verás una tabla con todas las proveedoras que tienen productos vendidos

### 3. Detalles por proveedora
La tabla mostrará:

| Columna | Descripción |
|---------|-------------|
| **Proveedora** | Nombre de la proveedora |
| **Productos vendidos** | Cantidad de items que se vendieron |
| **Total a pagar** | 60% del precio sugerido (valor para la proveedora) |
| **Estado** | ✓ Pagado o ○ Pendiente |

### 4. Ver detalles de productos
- Haz clic en "Ver detalles" para expandir
- Verás cada producto con:
  - Código y descripción
  - Precio sugerido
  - Valor para la proveedora (60%)

### 5. Registrar pago
- Haz clic en "Registrar pago"
- Se abre una modal con:
  - Lista de productos vendidos
  - Total a transferir
  - Vista previa del mensaje

### 6. Enviar por WhatsApp
- Haz clic en "📱 Enviar por WhatsApp"
- Se envía automáticamente un mensaje a la proveedora con:
  - Aviso de productos vendidos
  - Nombre de cada producto
  - Valor para la proveedora

**Mensaje de ejemplo:**
```
Hola, se vendieron estos de la lista: Producto A, Producto B
```

### 7. Transferir dinero (Mercado Pago)
- Haz clic en "💳 Transferir en Mercado Pago"
- Se abre Mercado Pago en una nueva pestaña
- Puedes completar la transferencia usando:
  - Alias (ej: miempresa.mp)
  - CBU bancaria

## Requisitos previos

### En "Proveedoras"
Cada proveedora debe tener:
- ✅ Nombre
- ✅ Teléfono (para WhatsApp)
- ✅ Alias o CBU (para Mercado Pago)

Para agregar/editar, ve a "Proveedoras" → "Nueva Proveedora"

### En el inventario
Cada producto debe tener:
- ✅ Código
- ✅ Descripción
- ✅ Precio sugerido
- ✅ Proveedora (debe coincidir con el nombre en la tabla de proveedoras)

## Cálculo de pagos

Para cada producto vendido:

```
Valor para proveedora = Precio sugerido × 60%
```

**Ejemplo:**
- Producto: Remera
- Precio sugerido: $100
- Valor para proveedora: $60

El total a pagar es la suma de todos los productos vendidos por esa proveedora.

## Integración con APIs

### WhatsApp
- Requiere configuración de Twilio o WhatsApp Cloud API
- Ve a `backend/WHATSAPP_MERCADO_PAGO_SETUP.md` para instrucciones

### Mercado Pago
- Redirige a la página de transferencias de Mercado Pago
- La proveedora completa la transferencia en su cuenta
- Requiere tener alias o CBU registrado

## Troubleshooting

### Error: "No hay número de teléfono"
→ Edita la proveedora y agrega un número de teléfono

### Error: "No hay alias o CBU cargado"
→ Edita la proveedora y agrega alias y/o CBU

### WhatsApp no se envía
→ Verifica que Twilio esté configurado en `backend/.env`

### No aparecen productos en Pagos
→ Los productos deben estar marcados como "vendidos"
→ Deben tener una proveedora asignada

## Flujo de datos

```
Inventario → Venta → Producto "vendido" → Agrupado por Proveedora → Vista de Pagos
```

## Estado de pago

- **○ Pendiente**: No se ha registrado el pago
- **✓ Pagado**: Se registró el envío por WhatsApp

Nota: Por ahora, el estado se actualiza localmente. En futuras versiones se integrará con registros en base de datos.

## Tips

💡 **Recomendaciones:**
1. Revisa la lista de productos antes de enviar
2. Usa el botón "Ver detalles" para verificar precios
3. Ten los datos bancarios de proveedoras actualizados
4. Confirma en WhatsApp después de transferir

---

¿Preguntas? Consulta `WHATSAPP_MERCADO_PAGO_SETUP.md` para más detalles técnicos.
