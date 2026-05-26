@echo off
REM Script de instalación y setup - Sistema de Pagos a Proveedoras (Windows)

echo ===============================================
echo Sistema de Pagos a Proveedoras - Setup Script
echo ===============================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist frontend (
    echo ❌ Error: frontend no encontrado
    goto error
)

if not exist backend (
    echo ❌ Error: backend no encontrado
    goto error
)

echo ✓ Estructura de proyecto correcta
echo.

REM ============================================
REM PASO 1: Frontend
REM ============================================

echo PASO 1: Frontend setup
echo ---

if not exist "frontend\src\components\PaymentsTable.jsx" (
    echo ❌ Error: PaymentsTable.jsx no encontrado
    goto error
)

if not exist "frontend\src\components\PaymentModal.jsx" (
    echo ❌ Error: PaymentModal.jsx no encontrado
    goto error
)

echo ✓ Componentes de Pagos encontrados
echo ✓ Frontend setup completado
echo.

REM ============================================
REM PASO 2: Backend
REM ============================================

echo PASO 2: Backend setup
echo ---

if not exist "backend\src\services\whatsappService.js" (
    echo ❌ Error: whatsappService.js no encontrado
    goto error
)

if not exist "backend\src\services\mercadoPagoService.js" (
    echo ❌ Error: mercadoPagoService.js no encontrado
    goto error
)

echo ✓ Servicios encontrados

if not exist "backend\package.json" (
    echo ❌ Error: backend\package.json no encontrado
    goto error
)

echo ✓ package.json encontrado
echo.

REM ============================================
REM PASO 3: Variables de entorno
REM ============================================

echo PASO 3: Configuración de variables de entorno
echo ---

if not exist "backend\.env" (
    echo ⚠️  backend\.env no existe
    echo    Se recomienda crear uno basado en .env.example
    if exist "backend\.env.example" (
        echo    ✓ backend\.env.example encontrado
        echo.
        echo    Para crear el archivo .env, ejecuta:
        echo    $ copy backend\.env.example backend\.env
        echo    $ notepad backend\.env
    )
) else (
    echo ✓ backend\.env existe
)

echo.

REM ============================================
REM PASO 4: Instalación de dependencias (opcional)
REM ============================================

echo PASO 4: Instalación de dependencias (OPCIONAL)
echo ---
echo.

set /p install_deps="¿Instalar dependencias opcionales? (s/n): "

if /i "%install_deps%"=="s" (
    echo Instalando Twilio para WhatsApp...
    cd backend
    call npm install twilio
    cd ..
    echo ✓ Twilio instalado
    echo.
    
    echo Instalando Mercado Pago SDK...
    cd backend
    call npm install mercadopago
    cd ..
    echo ✓ Mercado Pago instalado
) else (
    echo ⏭️  Omitiendo instalación de dependencias
)

echo.

REM ============================================
REM PASO 5: Documentación
REM ============================================

echo PASO 5: Verificación de documentación
echo ---

set "missing=0"

for %%f in (
    "README_PAGOS.md"
    "RESUMEN_VISUAL.md"
    "CAMBIOS_PAGOS.md"
    "GUIA_PAGOS.md"
    "EJEMPLOS_USO_PAGOS.js"
    "TESTING_PAGOS.md"
    "CHECKLIST_VERIFICACION.md"
    "backend\WHATSAPP_MERCADO_PAGO_SETUP.md"
) do (
    if exist %%f (
        echo ✓ %%f
    ) else (
        echo ❌ %%f ^(FALTA^)
        set /a missing+=1
    )
)

echo.

REM ============================================
REM RESUMEN
REM ============================================

echo ===============================================
echo SETUP COMPLETADO ✅
echo ===============================================
echo.

echo Próximos pasos:
echo.
echo 1. Leer la documentación:
echo    $ type README_PAGOS.md
echo.
echo 2. Revisar el resumen visual:
echo    $ type RESUMEN_VISUAL.md
echo.
echo 3. Ejecutar el servidor backend:
echo    $ cd backend ^&^& npm start
echo.
echo 4. Ejecutar el frontend:
echo    $ cd frontend ^&^& npm run dev
echo.
echo 5. Abrir en navegador:
echo    http://localhost:5173 ^(o el puerto asignado^)
echo.
echo 6. Probar la nueva vista de Pagos:
echo    - Cargar una venta
echo    - Ir a "Pagos" en el sidebar
echo.

if %missing% gtr 0 (
    echo ⚠️  Faltan %missing% archivos de documentación
    echo    Algunos archivos podrían no haberse copiado correctamente
)

echo.
echo ¿Preguntas? Consulta:
echo   - README_PAGOS.md - Índice general
echo   - GUIA_PAGOS.md - Guía de usuario
echo   - backend\WHATSAPP_MERCADO_PAGO_SETUP.md - Setup técnico
echo.

pause
goto :eof

:error
echo.
echo Error: Setup incompleto
pause
exit /b 1
