# 🗺️ MAPA DE LECTURA - Sistema de Pagos

## Eres...

### 👤 Un usuario final (Quiero usar la app)
**Tiempo total: ~20 minutos**

```
1. Lee: QUICK_START.md          (5 min) ← COMIENZA AQUÍ
   ↓
2. Prueba: Carga una venta      (3 min)
   ↓
3. Explora: Ve a "Pagos"        (2 min)
   ↓
4. Lee: GUIA_PAGOS.md           (10 min) ← Si necesitas más info
   ↓
5. ¡Listo a usar! 🚀
```

**Documentos que necesitas:**
- ✅ QUICK_START.md
- ✅ GUIA_PAGOS.md
- ✅ RESUMEN_VISUAL.md (opcional)

---

### 💻 Un desarrollador (Quiero entender el código)
**Tiempo total: ~1 hora**

```
1. Lee: README_PAGOS.md         (5 min) ← Índice general
   ↓
2. Lee: CAMBIOS_PAGOS.md        (15 min) ← Resumen técnico
   ↓
3. Explora: Archivos en carpetas (20 min)
   ├─ frontend/src/components/PaymentModal.jsx
   ├─ frontend/src/components/PaymentsTable.jsx
   ├─ backend/src/services/whatsappService.js
   └─ backend/src/services/mercadoPagoService.js
   ↓
4. Lee: EJEMPLOS_USO_PAGOS.js   (10 min) ← Ver ejemplos prácticos
   ↓
5. Prueba: Testing manual      (10 min) ← Ver TESTING_PAGOS.md
   ↓
6. ¡Listo a modificar! 🔧
```

**Documentos que necesitas:**
- ✅ README_PAGOS.md
- ✅ CAMBIOS_PAGOS.md
- ✅ EJEMPLOS_USO_PAGOS.js
- ✅ TESTING_PAGOS.md

---

### 🔧 Un administrador (Quiero configurar APIs)
**Tiempo total: ~2-3 horas**

```
1. Lee: backend/WHATSAPP_MERCADO_PAGO_SETUP.md
   ↓
   Twilio:                    (30-45 min)
   ├─ Crear cuenta
   ├─ Obtener credenciales
   ├─ Configurar Sandbox
   └─ Agregar a .env
   ↓
   Mercado Pago:              (30-45 min)
   ├─ Crear aplicación
   ├─ Obtener Access Token
   ├─ Configurar alias/CBU
   └─ Agregar a .env
   ↓
2. Instala dependencias:       (5 min)
   npm install twilio
   npm install mercadopago
   ↓
3. Prueba:                     (30 min)
   ├─ Sandbox de Twilio
   ├─ Sandbox de Mercado Pago
   └─ Testing manual
   ↓
4. ¡Listo en producción! 🚀
```

**Documentos que necesitas:**
- ✅ backend/WHATSAPP_MERCADO_PAGO_SETUP.md
- ✅ backend/.env.example

---

### 🧪 Un QA/Tester (Quiero probar el sistema)
**Tiempo total: ~2-3 horas**

```
1. Lee: TESTING_PAGOS.md       (20 min) ← Plan de testing
   ↓
2. Prepara ambiente:           (10 min)
   - Backend corriendo
   - Frontend corriendo
   - Browser abierto
   ↓
3. Ejecuta tests:              (60-90 min)
   Fase 1: Frontend - 15 min
   Fase 2: Modal - 10 min
   Fase 3: WhatsApp - 15 min
   Fase 4: Mercado Pago - 15 min
   Fase 5: Cálculos - 10 min
   Fase 6: Filtrado - 5 min
   Fase 7: Flujo E2E - 15 min
   ↓
4. Documenta:                  (30 min)
   - Casos pasados
   - Casos fallidos (si hay)
   - Ajustes necesarios
   ↓
5. ¡Listo para release! ✅
```

**Documentos que necesitas:**
- ✅ TESTING_PAGOS.md
- ✅ CHECKLIST_VERIFICACION.md

---

### 📊 Un PM/Manager (Quiero saber qué se hizo)
**Tiempo total: ~30 minutos**

```
1. Lee: PRESENTACION.md        (10 min) ← Overview visual
   ↓
2. Lee: CAMBIOS_PAGOS.md       (10 min) ← Cambios técnicos
   ↓
3. Ve: RESUMEN_VISUAL.md       (10 min) ← Diagramas
   ↓
4. Revisa: CHECKLIST_VERIFICACION.md ← Status
   ↓
5. ¡Listo para reportar! 📊
```

**Documentos que necesitas:**
- ✅ PRESENTACION.md
- ✅ CAMBIOS_PAGOS.md
- ✅ RESUMEN_VISUAL.md
- ✅ CHECKLIST_VERIFICACION.md

---

## 📚 MAPA CONCEPTUAL

```
┌─────────────────────────────────────────────────┐
│          ENTRADA A TODO                         │
│         README_PAGOS.md                         │
│      (Índice + Guía rápida)                     │
└────────┬────────────────────┬────────────────────┘
         │                    │
         ↓                    ↓
    USUARIOS            DESARROLLADORES
    (5 min)            (1 hora)
         │                    │
    QUICK_START          CAMBIOS_PAGOS
      ↓                       ↓
   GUIA_PAGOS          EJEMPLOS_USO
      ↓                       ↓
   LISTO                  TESTING
                             ↓
                           LISTO

         ↓↓↓ OTROS ↓↓↓

    ADMINISTRADOR       TESTER         MANAGER
    (2-3 horas)      (2-3 horas)      (30 min)
         │               │                │
   WHATSAPP_SETUP    TESTING_PAGOS    PRESENTACION
   MERCADO_PAGO      CHECKLIST        CAMBIOS_PAGOS
      ↓                  ↓               ↓
    LISTO             LISTO           LISTO
```

---

## 🎯 POR OBJETIVO

### "Quiero empezar AHORA"
→ QUICK_START.md (5 min)

### "Quiero entender QUÉ se hizo"
→ PRESENTACION.md (10 min)
→ RESUMEN_VISUAL.md (10 min)

### "Quiero entender CÓMO funciona"
→ CAMBIOS_PAGOS.md (15 min)
→ Revisar archivos (30 min)

### "Quiero VER ejemplos de código"
→ EJEMPLOS_USO_PAGOS.js (20 min)

### "Quiero CONFIGURAR Twilio/Mercado Pago"
→ backend/WHATSAPP_MERCADO_PAGO_SETUP.md (45-90 min)

### "Quiero PROBAR el sistema"
→ TESTING_PAGOS.md (2-3 horas)

### "Quiero DEBUGGING/troubleshooting"
→ GUIA_PAGOS.md (sección Troubleshooting)

---

## ⏱️ TIEMPOS ESTIMADOS

| Tipo | Tiempo | Documento |
|------|--------|-----------|
| Rápido (5 min) | 5 min | QUICK_START.md |
| Usuario (20 min) | 20 min | QUICK_START + GUIA_PAGOS |
| Developer (60 min) | 60 min | README + CAMBIOS + EJEMPLOS |
| Admin (2-3 horas) | 120-180 min | SETUP + Config real |
| Tester (2-3 horas) | 120-180 min | TESTING + Checklist |
| Manager (30 min) | 30 min | PRESENTACION + CAMBIOS |

---

## 📋 CHECKLIST POR ROL

### Usuario final ✓
- [ ] Leer QUICK_START.md
- [ ] Cargar una venta
- [ ] Ir a "Pagos"
- [ ] Abrir modal
- [ ] Leer GUIA_PAGOS.md si necesita más

### Desarrollador ✓
- [ ] Leer README_PAGOS.md
- [ ] Leer CAMBIOS_PAGOS.md
- [ ] Revisar código de componentes
- [ ] Revisar código de servicios
- [ ] Leer EJEMPLOS_USO_PAGOS.js
- [ ] Ejecutar TESTING_PAGOS.md

### Administrador ✓
- [ ] Leer WHATSAPP_MERCADO_PAGO_SETUP.md
- [ ] Crear cuenta Twilio
- [ ] Crear aplicación Mercado Pago
- [ ] Obtener credenciales
- [ ] Configurar .env
- [ ] Instalar dependencias
- [ ] Probar en Sandbox
- [ ] Pasar a producción

### Tester ✓
- [ ] Leer TESTING_PAGOS.md
- [ ] Preparar ambiente (backend + frontend)
- [ ] Ejecutar Fase 1: Frontend
- [ ] Ejecutar Fase 2: Modal
- [ ] Ejecutar Fase 3: WhatsApp
- [ ] Ejecutar Fase 4: Mercado Pago
- [ ] Ejecutar Fase 5: Cálculos
- [ ] Ejecutar Fase 6: Filtrado
- [ ] Ejecutar Fase 7: E2E
- [ ] Documentar resultados
- [ ] Marcar CHECKLIST_VERIFICACION

### Manager ✓
- [ ] Leer PRESENTACION.md
- [ ] Leer CAMBIOS_PAGOS.md
- [ ] Revisar CHECKLIST_VERIFICACION.md
- [ ] Ver RESUMEN_VISUAL.md
- [ ] Preparar reporte

---

## 🔗 REFERENCIAS CRUZADAS RÁPIDAS

**¿Algo no funciona?**
→ GUIA_PAGOS.md (sección Troubleshooting)

**¿Quiero ver ejemplos?**
→ EJEMPLOS_USO_PAGOS.js

**¿Necesito setup técnico?**
→ backend/WHATSAPP_MERCADO_PAGO_SETUP.md

**¿Quiero validar todo?**
→ CHECKLIST_VERIFICACION.md

**¿Necesito índice general?**
→ README_PAGOS.md

**¿Quiero visual?**
→ PRESENTACION.md o RESUMEN_VISUAL.md

---

## 💡 TIPS DE NAVEGACIÓN

1. **Todos comienzan en**: README_PAGOS.md
2. **Si tienes poco tiempo**: QUICK_START.md (5 min)
3. **Si eres usuario**: GUIA_PAGOS.md
4. **Si eres developer**: CAMBIOS_PAGOS.md + código
5. **Si necesitas help**: GUIA_PAGOS.md Troubleshooting
6. **Si eres admin**: backend/WHATSAPP_MERCADO_PAGO_SETUP.md
7. **Si necesitas status**: CHECKLIST_VERIFICACION.md
8. **Si reportas**: PRESENTACION.md

---

**¿Listo? Elige tu rol arriba y comienza! 🚀**

---

*Última actualización: 24/05/2026*
