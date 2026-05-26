# ⚡ Quick Start - 5 minutos

## 🚀 Comienza en 5 minutos

### ¿Qué acabamos de agregar?

Una **nueva vista de Pagos** que agrupa productos vendidos por proveedora y permite:
- 📱 Enviar WhatsApp automático
- 💳 Transferir en Mercado Pago
- 💰 Calcular automáticamente el valor (60%)

---

## 1️⃣ Preparación (1 minuto)

### Asegúrate de tener datos:

1. **Proveedoras con información completa:**
   - Nombre
   - Teléfono (5491123456789)
   - Alias o CBU para Mercado Pago

   → Ve a "Proveedoras" → "Nueva Proveedora"

2. **Inventario con productos:**
   - Código
   - Descripción
   - Precio sugerido
   - Proveedora asignada

   → Ve a "Inventario" → "Agregar producto"

---

## 2️⃣ Cargar una venta (2 minutos)

```
1. Haz clic en "Ventas" (sidebar)
2. Haz clic en "Agregar venta"
3. Busca un producto y haz clic "Agregar"
4. Selecciona método de pago (ej: "Transferencia")
5. Haz clic "Cargar venta"
```

✓ El producto ahora está marcado como "vendido"

---

## 3️⃣ Ir a la vista de Pagos (1 minuto)

```
1. Haz clic en "Pagos" (sidebar)
2. Verás una tabla con proveedoras que tienen productos vendidos
```

**Tabla muestra:**
- Nombre de proveedora
- Cantidad de productos vendidos
- **Total a pagar** (60% del precio)
- Estado (Pendiente/Pagado)

---

## 4️⃣ Registrar un pago (1 minuto)

```
1. Haz clic "Ver detalles" para expandir
2. Haz clic "Registrar pago"
3. Se abre una modal con todo
```

**Modal muestra:**
- Lista de productos
- Valor de cada uno (60%)
- Mensaje que se enviará

---

## 5️⃣ Dos opciones:

### Opción A: Enviar por WhatsApp 📱
```
1. Haz clic "Enviar por WhatsApp"
2. ✓ Mensaje enviado a la proveedora
```

**Mensaje:**
```
Hola, se vendieron estos de la lista: Producto A, Producto B
```

### Opción B: Transferir en Mercado Pago 💳
```
1. Haz clic "Transferir en Mercado Pago"
2. Se abre Mercado Pago en nueva pestaña
3. Completa la transferencia (solo la primera vez)
```

---

## ✨ Ejemplo práctico

### Scenario:
- Tienes 3 productos vendidos de "Proveedora A"
- Precio sugerido: $100 cada uno
- Valor para proveedora: $60 cada uno

### Flujo:
```
1. Ve a "Pagos" → Ves "Proveedora A" con total $180 (3 × $60)
2. Haz clic "Ver detalles" → Ves los 3 productos
3. Haz clic "Registrar pago" → Abre modal
4. Modal muestra:
   - Remera azul ($60)
   - Pantalón negro ($60)
   - Campera ($60)
   - Total: $180
5. Opción: Enviar WhatsApp o Mercado Pago
```

---

## 🔍 Verificar que funciona

### Checklist rápido:
- [ ] ¿Ves la opción "Pagos" en el sidebar?
- [ ] ¿La tabla muestra proveedoras con productos vendidos?
- [ ] ¿El total es 60% del precio sugerido?
- [ ] ¿Puedes hacer clic en "Ver detalles"?
- [ ] ¿Puedes abrir la modal de pago?
- [ ] ¿Los botones de WhatsApp y Mercado Pago están presentes?

Si dijiste "sí" a todo → **¡Funciona! ✅**

---

## ❓ Si algo no funciona

### "No veo la opción Pagos"
→ Recarga la página (F5)
→ Comprueba que hay ventas cargadas

### "La tabla está vacía"
→ Necesitas cargar una venta primero
→ Ve a "Ventas" → "Agregar venta"

### "El botón de WhatsApp no funciona"
→ Por ahora es simulado (no envía en realidad)
→ Para activarlo, necesitas configurar Twilio

### "Mercado Pago no abre"
→ Primero, asegúrate que la proveedora tiene alias/CBU
→ El link debería abrir en nueva pestaña

---

## 📚 Para aprender más

| Tema | Documento |
|------|-----------|
| **Vista general** | [RESUMEN_VISUAL.md](RESUMEN_VISUAL.md) |
| **Cómo usar** | [GUIA_PAGOS.md](GUIA_PAGOS.md) |
| **Cambios técnicos** | [CAMBIOS_PAGOS.md](CAMBIOS_PAGOS.md) |
| **Configurar Twilio** | [backend/WHATSAPP_MERCADO_PAGO_SETUP.md](backend/WHATSAPP_MERCADO_PAGO_SETUP.md) |
| **Índice completo** | [README_PAGOS.md](README_PAGOS.md) |

---

## 💡 Tips

✅ **Antes de transferir:**
- Verifica el total en la modal
- Comprueba que la proveedora tiene alias/CBU
- Envía por WhatsApp para avisar

✅ **Para WhatsApp real:**
- Necesitas configurar Twilio
- Consulta: backend/WHATSAPP_MERCADO_PAGO_SETUP.md

✅ **Para Mercado Pago:**
- El link se abre automáticamente
- Solo la primera vez es completo
- Siguientes pueden ser más rápidos

---

## 🎯 Próximo paso

**Ahora estás listo para usar el sistema. ¡Pruébalo!**

```
1. Carga una venta
2. Ve a "Pagos"
3. Prueba la modal
4. Haz clic en los botones
```

---

## 🆘 ¿Necesitas ayuda?

1. **Guía completa**: [GUIA_PAGOS.md](GUIA_PAGOS.md)
2. **Troubleshooting**: Sección al final de GUIA_PAGOS.md
3. **Ejemplos de código**: [EJEMPLOS_USO_PAGOS.js](EJEMPLOS_USO_PAGOS.js)

---

**¡Listo! Disfruta el nuevo sistema de pagos. 🚀**

---

*Última actualización: 24/05/2026*
