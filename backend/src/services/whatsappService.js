/**
 * Servicio para integración con WhatsApp
 * Soporta múltiples proveedores
 */

export async function sendWhatsAppMessage(phoneNumber, message, provider = 'twilio') {
  if (provider === 'twilio') {
    return await sendViatwilio(phoneNumber, message);
  } else if (provider === 'whatsapp-cloud-api') {
    return await sendViaCloudAPI(phoneNumber, message);
  } else {
    throw new Error(`Proveedor no soportado: ${provider}`);
  }
}

/**
 * Enviar mediante Twilio
 */
async function sendViatwilio(phoneNumber, message) {
  try {
    const twilio = (await import('twilio')).default;
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      throw new Error('Credenciales de Twilio no configuradas');
    }

    const client = twilio(accountSid, authToken);

    const result = await client.messages.create({
      from: `whatsapp:${twilioPhoneNumber}`,
      to: `whatsapp:+${phoneNumber}`,
      body: message,
    });

    return {
      success: true,
      messageId: result.sid,
      provider: 'twilio',
    };
  } catch (error) {
    console.error('Error en Twilio:', error);
    throw error;
  }
}

/**
 * Enviar mediante WhatsApp Cloud API (Meta)
 */
async function sendViaCloudAPI(phoneNumber, message) {
  try {
    const axios = (await import('axios')).default;
    
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !businessAccountId) {
      throw new Error('Credenciales de WhatsApp Cloud API no configuradas');
    }

    const url = `https://graph.instagram.com/v18.0/${businessAccountId}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          preview_url: true,
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      provider: 'whatsapp-cloud-api',
    };
  } catch (error) {
    console.error('Error en WhatsApp Cloud API:', error);
    throw error;
  }
}

/**
 * Formatear número de teléfono a formato internacional
 */
export function formatPhoneNumber(phoneNumber) {
  // Remover caracteres especiales
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Si no comienza con +, asumir que es Argentina (+54)
  if (!cleaned.startsWith('54')) {
    // Si comienza con 9, es celular
    if (cleaned.startsWith('9')) {
      cleaned = '54' + cleaned;
    } else if (cleaned.startsWith('0')) {
      // Si comienza con 0, removarlo
      cleaned = '54' + cleaned.substring(1);
    } else {
      // Asumir que es Argentina
      cleaned = '54' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Validar formato de número de teléfono
 */
export function isValidPhoneNumber(phoneNumber) {
  const formatted = formatPhoneNumber(phoneNumber);
  // Debe tener al menos 10 dígitos después del código de país
  return formatted.length >= 12 && formatted.length <= 15;
}
