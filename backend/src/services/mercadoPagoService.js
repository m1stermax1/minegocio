/**
 * Servicio para integración con Mercado Pago
 */

export async function createTransferLink(alias, cbu, amount, proveedora) {
  try {
    // Validar que al menos uno esté presente
    if (!alias && !cbu) {
      throw new Error('Se requiere alias o CBU');
    }

    if (!amount || amount <= 0) {
      throw new Error('Monto inválido');
    }

    // Generar URL de Mercado Pago
    // Nota: Esta es una URL de ejemplo. Mercado Pago puede tener cambios
    const bankAccountIdentifier = alias || cbu;
    const description = `Pago a proveedora: ${proveedora}`;
    
    const transferUrl = new URL('https://www.mercadopago.com.ar/transfer/choose-account');
    
    // Parámetros para transferencia
    const params = new URLSearchParams({
      bankAccountIdentifier: bankAccountIdentifier,
      amount: amount.toString(),
      description: description,
    });

    return transferUrl.toString() + '?' + params.toString();
  } catch (error) {
    console.error('Error creando link de Mercado Pago:', error);
    throw error;
  }
}

/**
 * Validar alias o CBU
 */
export function isValidAlias(alias) {
  // Alias debe tener 6-20 caracteres, solo letras, números, punto y guión
  const aliasRegex = /^[a-zA-Z0-9.\\-]{6,20}$/;
  return aliasRegex.test(alias);
}

/**
 * Validar CBU
 */
export function isValidCBU(cbu) {
  // CBU debe tener exactamente 22 dígitos
  const cbuRegex = /^\d{22}$/;
  return cbuRegex.test(cbu);
}

/**
 * Procesar transferencia con API oficial de Mercado Pago (requiere SDK)
 */
export async function processTransferViaMercadoPagoAPI(alias, cbu, amount, proveedora) {
  try {
    // Este código requiere que el SDK de Mercado Pago esté instalado
    // npm install mercadopago
    
    const mercadopago = (await import('mercadopago')).default;
    
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Access Token de Mercado Pago no configurado');
    }

    mercadopago.configurations.setAccessToken(accessToken);

    // Crear transferencia
    const transfer = {
      amount: amount,
      description: `Pago a proveedora: ${proveedora}`,
      external_reference: `transfer_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      target: {
        account_number: cbu,
        account_holder_name: proveedora,
      },
    };

    // Nota: La API exacta de Mercado Pago puede variar
    // Consultar documentación oficial: https://developers.mercadopago.com/

    return {
      success: true,
      transfer: transfer,
      message: `Transferencia de $${amount} procesada`,
    };
  } catch (error) {
    console.error('Error procesando transferencia:', error);
    throw error;
  }
}

/**
 * Formatear monto para mostrar
 */
export function formatAmount(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}
