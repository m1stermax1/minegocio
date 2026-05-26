#!/bin/bash
# Script de instalación y setup - Sistema de Pagos a Proveedoras

echo "==============================================="
echo "Sistema de Pagos a Proveedoras - Setup Script"
echo "==============================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

echo "✓ Estructura de proyecto correcta"
echo ""

# ============================================
# PASO 1: Frontend
# ============================================

echo "PASO 1: Frontend setup"
echo "---"

if [ ! -f "frontend/src/components/PaymentsTable.jsx" ]; then
    echo "❌ Error: PaymentsTable.jsx no encontrado"
    echo "   (Debería estar en frontend/src/components/)"
    exit 1
fi

if [ ! -f "frontend/src/components/PaymentModal.jsx" ]; then
    echo "❌ Error: PaymentModal.jsx no encontrado"
    echo "   (Debería estar en frontend/src/components/)"
    exit 1
fi

echo "✓ Componentes de Pagos encontrados"
echo "✓ Frontend setup completado"
echo ""

# ============================================
# PASO 2: Backend
# ============================================

echo "PASO 2: Backend setup"
echo "---"

if [ ! -f "backend/src/services/whatsappService.js" ]; then
    echo "❌ Error: whatsappService.js no encontrado"
    exit 1
fi

if [ ! -f "backend/src/services/mercadoPagoService.js" ]; then
    echo "❌ Error: mercadoPagoService.js no encontrado"
    exit 1
fi

echo "✓ Servicios encontrados"

# Verificar si package.json existe
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: backend/package.json no encontrado"
    exit 1
fi

echo "✓ package.json encontrado"
echo ""

# ============================================
# PASO 3: Variables de entorno
# ============================================

echo "PASO 3: Configuración de variables de entorno"
echo "---"

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env no existe"
    echo "   Se recomienda crear uno basado en .env.example"
    if [ -f "backend/.env.example" ]; then
        echo "   ✓ backend/.env.example encontrado"
        echo ""
        echo "   Para crear el archivo .env, ejecuta:"
        echo "   $ cp backend/.env.example backend/.env"
        echo "   $ nano backend/.env  # O tu editor favorito"
    fi
else
    echo "✓ backend/.env existe"
fi

echo ""

# ============================================
# PASO 4: Instalación de dependencias (opcional)
# ============================================

echo "PASO 4: Instalación de dependencias (OPCIONAL)"
echo "---"

read -p "¿Instalar dependencias opcionales? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Instalando Twilio para WhatsApp..."
    cd backend
    npm install twilio
    cd ..
    echo "✓ Twilio instalado"
    
    echo ""
    echo "Instalando Mercado Pago SDK..."
    cd backend
    npm install mercadopago
    cd ..
    echo "✓ Mercado Pago instalado"
else
    echo "⏭️  Omitiendo instalación de dependencias"
fi

echo ""

# ============================================
# PASO 5: Documentación
# ============================================

echo "PASO 5: Verificación de documentación"
echo "---"

docs=(
    "README_PAGOS.md"
    "RESUMEN_VISUAL.md"
    "CAMBIOS_PAGOS.md"
    "GUIA_PAGOS.md"
    "EJEMPLOS_USO_PAGOS.js"
    "TESTING_PAGOS.md"
    "CHECKLIST_VERIFICACION.md"
    "backend/WHATSAPP_MERCADO_PAGO_SETUP.md"
)

missing=0
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "✓ $doc"
    else
        echo "❌ $doc (FALTA)"
        missing=$((missing + 1))
    fi
done

echo ""

# ============================================
# RESUMEN
# ============================================

echo "==============================================="
echo "SETUP COMPLETADO ✅"
echo "==============================================="
echo ""

echo "Próximos pasos:"
echo ""
echo "1. Leer la documentación:"
echo "   $ cat README_PAGOS.md"
echo ""
echo "2. Revisar el resumen visual:"
echo "   $ cat RESUMEN_VISUAL.md"
echo ""
echo "3. Ejecutar el servidor backend:"
echo "   $ cd backend && npm start"
echo ""
echo "4. Ejecutar el frontend:"
echo "   $ cd frontend && npm run dev"
echo ""
echo "5. Abrir en navegador:"
echo "   http://localhost:5173 (o el puerto asignado)"
echo ""
echo "6. Probar la nueva vista de Pagos:"
echo "   - Cargar una venta"
echo "   - Ir a 'Pagos' en el sidebar"
echo ""

if [ $missing -gt 0 ]; then
    echo "⚠️  Faltan $missing archivos de documentación"
    echo "   Algunos archivos podrían no haberse copiado correctamente"
fi

echo ""
echo "¿Preguntas? Consulta:"
echo "  - README_PAGOS.md - Índice general"
echo "  - GUIA_PAGOS.md - Guía de usuario"
echo "  - backend/WHATSAPP_MERCADO_PAGO_SETUP.md - Setup técnico"
echo ""
