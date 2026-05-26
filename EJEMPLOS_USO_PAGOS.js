/**
 * Ejemplos de uso de la API de Pagos
 */

// ============================================
// EJEMPLO 1: Enviar mensaje por WhatsApp
// ============================================

const whatsappPayload = {
  phoneNumber: "5491123456789",
  message: "Hola, se vendieron estos de la lista: Producto A, Producto B",
  items: [
    {
      codigo: "PROD001",
      descripcion: "Producto A",
      precio: 100,
      precioProveedora: 60
    },
    {
      codigo: "PROD002",
      descripcion: "Producto B",
      precio: 80,
      precioProveedora: 48
    }
  ]
};

// Enviar a backend
fetch('http://localhost:3001/inventory/whatsapp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(whatsappPayload)
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✓ WhatsApp enviado:', data.messageId);
    } else {
      console.error('✗ Error:', data.error);
    }
  })
  .catch(err => console.error('Error:', err));

// ============================================
// EJEMPLO 2: Crear link de transferencia en Mercado Pago
// ============================================

const mercadoPagoPayload = {
  alias: "miempresa.mp",
  cbu: "1234567890123456789012",
  amount: 108,  // Total a pagar (60 + 48)
  proveedora: "Proveedor X"
};

// Enviar a backend
fetch('http://localhost:3001/inventory/mercadopago/transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(mercadoPagoPayload)
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✓ Link generado:', data.redirectUrl);
      // Abrir en nueva ventana
      window.open(data.redirectUrl, '_blank');
    } else {
      console.error('✗ Error:', data.error);
    }
  })
  .catch(err => console.error('Error:', err));

// ============================================
// EJEMPLO 3: Flujo completo en PaymentModal
// ============================================

/*
const payment = {
  proveedora: {
    nombre: "Proveedor X",
    telefono: "5491123456789",
    alias: "miempresa.mp",
    cbu: "1234567890123456789012"
  },
  items: [
    {
      codigo: "PROD001",
      descripcion: "Producto A",
      precio: 100,
      precioProveedora: 60
    }
  ],
  totalProvider: 60
};

// El usuario hace clic en "Enviar por WhatsApp"
handleSendWhatsApp = async () => {
  const messageText = `Hola, se vendió este de la lista: ${payment.items.map(i => i.descripcion).join(", ")}`;
  
  await sendWhatsAppMessage({
    phoneNumber: payment.proveedora.telefono,
    message: messageText,
    items: payment.items
  });
};

// El usuario hace clic en "Transferir en Mercado Pago"
handleMercadoPagoTransfer = async () => {
  const redirectUrl = await createMercadoPagoTransfer({
    alias: payment.proveedora.alias,
    cbu: payment.proveedora.cbu,
    amount: payment.totalProvider,
    proveedora: payment.proveedora.nombre
  });
  
  window.open(redirectUrl, '_blank');
};
*/

// ============================================
// EJEMPLO 4: Respuestas esperadas del backend
// ============================================

// Respuesta exitosa de WhatsApp:
const successWhatsApp = {
  success: true,
  message: "Mensaje de WhatsApp enviado exitosamente",
  phoneNumber: "5491123456789",
  provider: "twilio",
  messageId: "SM1234567890abcdef",
  timestamp: "2026-05-24T12:34:56.789Z"
};

// Respuesta exitosa de Mercado Pago:
const successMercadoPago = {
  success: true,
  redirectUrl: "https://www.mercadopago.com.ar/transfer/choose-account?bankAccountIdentifier=miempresa.mp&amount=108&description=Pago+a+proveedora%3A+Proveedor+X",
  message: "Transferencia de $108 a Proveedor X",
  timestamp: "2026-05-24T12:34:56.789Z"
};

// Respuesta error - teléfono inválido:
const errorPhone = {
  error: "Número de teléfono inválido",
  details: "El número debe estar en formato internacional (+54 para Argentina)"
};

// Respuesta error - sin CBU/alias:
const errorCBU = {
  error: "Se requiere alias o CBU",
  details: "Asegúrate de haber cargado esta información en la proveedora"
};

// ============================================
// EJEMPLO 5: Validaciones en frontend
// ============================================

/*
// Validar antes de enviar WhatsApp
if (!payment.proveedora?.telefono) {
  throw new Error("No hay número de teléfono para esta proveedora");
}

// Validar antes de transferencia en Mercado Pago
if (!payment.proveedora?.alias && !payment.proveedora?.cbu) {
  throw new Error("No hay alias o CBU cargado para esta proveedora");
}

// Validar monto
if (!payment.totalProvider || payment.totalProvider <= 0) {
  throw new Error("Monto inválido");
}
*/

// ============================================
// EJEMPLO 6: Formato de mensajes
// ============================================

/*
Un solo producto:
"Hola, se vendió este de la lista: Remera azul"

Múltiples productos:
"Hola, se vendieron estos de la lista: Remera azul, Pantalón negro, Campera"
*/

// ============================================
// EJEMPLO 7: cURL para pruebas
// ============================================

/*

// Enviar WhatsApp:
curl -X POST http://localhost:3001/inventory/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5491123456789",
    "message": "Hola, se vendieron estos de la lista: Producto A, Producto B",
    "items": [
      {"codigo": "PROD001", "descripcion": "Producto A", "precio": 100, "precioProveedora": 60}
    ]
  }'

// Crear transferencia Mercado Pago:
curl -X POST http://localhost:3001/inventory/mercadopago/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "miempresa.mp",
    "cbu": "1234567890123456789012",
    "amount": 108,
    "proveedora": "Proveedor X"
  }'

*/

// ============================================
// EJEMPLO 8: Cálculo de precios
// ============================================

function calculateProviderPrice(suggestedPrice) {
  return suggestedPrice * 0.6; // 60% para la proveedora
}

function calculateProviderTotal(items) {
  return items.reduce((sum, item) => {
    return sum + calculateProviderPrice(item.precio);
  }, 0);
}

// Ejemplo:
const items = [
  { precio: 100 },  // 60
  { precio: 80 },   // 48
  { precio: 120 }   // 72
];

console.log('Total para proveedora:', calculateProviderTotal(items)); // 180

// ============================================
// EJEMPLO 9: Formateo de números
// ============================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount);
}

console.log(formatCurrency(108)); // $ 108,00
console.log(formatCurrency(1234.56)); // $ 1.234,56
