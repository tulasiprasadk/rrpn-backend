/**
 * UPI Payment Service
 * Handles UPI QR code generation and payment verification
 * 
 * Note: Install qrcode package: npm install qrcode
 */

/**
 * Generate UPI payment URL
 * Format: upi://pay?pa=<UPI_ID>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR&tn=<TRANSACTION_NOTE>
 */
export function generateUPIUrl(orderId, amount, payeeUpiId, payeeName, transactionNote) {
  const upiId = payeeUpiId || process.env.UPI_ID || 'your-upi-id@paytm';
  const name = payeeName || process.env.UPI_PAYEE_NAME || 'RR Nagar';
  const note = transactionNote || `Order ${orderId}`;
  
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generate UPI QR Code (Static image)
 * Uses a static QR code image instead of generating dynamically
 */
export async function generateUPIQRCode(orderId, amount, payeeUpiId, payeeName, transactionNote) {
  try {
    const upiUrl = generateUPIUrl(orderId, amount, payeeUpiId, payeeName, transactionNote);
    
    // Use static QR code image instead of generating dynamically
    // The QR code image should be placed in frontend/public/upi-qr-code.png
    // For production, use the full URL; for local, use relative path
    const qrCodePath = process.env.QR_CODE_IMAGE_PATH || '/upi-qr-code.png';
    
    // If running on server, return full URL; otherwise return relative path
    const baseUrl = process.env.FRONTEND_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL || process.env.FRONTEND_URL}` 
      : '';
    const qrCodeUrl = baseUrl ? `${baseUrl}${qrCodePath}` : qrCodePath;

    return {
      qrCode: qrCodeUrl,
      upiUrl: upiUrl,
      upiId: payeeUpiId || process.env.UPI_ID,
      amount: amount,
      orderId: orderId
    };
  } catch (error) {
    console.error('Error getting UPI QR code:', error);
    // Fallback: return UPI URL only
    return {
      qrCode: '/upi-qr-code.png', // Fallback to static image
      upiUrl: generateUPIUrl(orderId, amount, payeeUpiId, payeeName, transactionNote),
      upiId: payeeUpiId || process.env.UPI_ID,
      amount: amount,
      orderId: orderId,
      error: error.message
    };
  }
}

/**
 * Verify UPI payment (manual verification via transaction ID)
 * In production, integrate with payment gateway webhook
 */
export function verifyUPIPayment(transactionId, amount, orderId) {
  // For Phase 1: Manual verification
  // Admin will verify payment via transaction ID/UPI reference number
  // In future: Integrate with payment gateway webhook for automatic verification
  
  return {
    verified: false,
    transactionId: transactionId,
    amount: amount,
    orderId: orderId,
    method: 'manual' // 'manual' or 'webhook'
  };
}

/**
 * Generate payment reference number
 */
export function generatePaymentReference() {
  return `RRN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}
