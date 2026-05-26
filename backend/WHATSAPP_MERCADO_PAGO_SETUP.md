# Integración de WhatsApp y Mercado Pago

Este documento explica cómo integrar los servicios de WhatsApp y Mercado Pago en el backend.

## WhatsApp Integration

### Opciones disponibles:

#### 1. Twilio (Recomendado para comenzar)
- Crear cuenta en https://www.twilio.com/
- Obtener credenciales (Account SID, Auth Token)
- Usar el Sandbox de WhatsApp de Twilio para pruebas

**Instalación:**
```bash
npm install twilio
```

**Implementación en `inventoryRoutes.js`:**
```javascript
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = twilio(accountSid, authToken);

// En el endpoint POST /whatsapp/send
await client.messages.create({
  from: twilioPhoneNumber,
  to: `whatsapp:+${phoneNumber}`,
  body: message,
});
```

#### 2. WhatsApp Cloud API (Oficial)
- Crear aplicación en Meta Developers
- Obtener token de acceso
- Registrar números de teléfono

**Instalación:**
```bash
npm install axios
```

**Variables de entorno necesarias:**
```
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
```

---

## Mercado Pago Integration

### Configuración:

#### 1. Crear aplicación en Mercado Pago
- Ir a https://www.mercadopago.com/developers
- Crear una nueva aplicación
- Obtener las credenciales (Access Token, Client ID)

#### 2. Instalación
```bash
npm install mercadopago
```

**Variables de entorno:**
```
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_USER_ID=
```

#### 3. Implementación en `inventoryRoutes.js`

```javascript
import mercadopago from 'mercadopago';

mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

// En el endpoint POST /mercadopago/transfer
const transfer = {
  amount: amount,
  description: `Pago a proveedora: ${proveedora}`,
  external_reference: `transfer_${Date.now()}`,
};

const result = await mercadopago.transfer.create(transfer);
```

---

## Variables de entorno (.env)

Agregar al archivo `.env` en la carpeta `backend`:

```
# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+1234567890

# O WhatsApp Cloud API
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_USER_ID=
```

---

## Flujo de pagos esperado

1. **Usuario hace clic en "Registrar pago"**
   - Se abre la modal de pago
   - Muestra productos vendidos y total a pagar

2. **Usuario hace clic en "Enviar por WhatsApp"**
   - Sistema valida que tenga número de teléfono
   - Envía mensaje con lista de productos
   - Muestra confirmación

3. **Usuario hace clic en "Transferir en Mercado Pago"**
   - Redirige a Mercado Pago con alias/CBU
   - Usuario completa la transferencia
   - Opcionalmente, registrar en base de datos después

---

## Datos de proveedoras necesarios

Los siguientes campos deben estar en la tabla de "proveedoras maxi":

- `nombre`: Nombre de la proveedora
- `telefono`: Número de teléfono (formato: 5491123456789)
- `alias`: Alias de Mercado Pago
- `cbu`: CBU bancaria

---

## Testing

Para pruebas sin integraciones reales:

1. Usar Twilio Sandbox: https://www.twilio.com/console/sms/whatsapp/learn
2. Usar Mercado Pago Sandbox: https://sandbox.mercadopago.com.ar

---

## Notas importantes

- **Seguridad**: Nunca hardcodear tokens en el código
- **Rate Limiting**: Implementar límites de envío para evitar abuso
- **Validación**: Validar números de teléfono antes de enviar
- **Logs**: Registrar cada envío para auditoría
