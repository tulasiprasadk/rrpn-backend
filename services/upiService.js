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
 * Generate UPI QR Code (Base64 image)
 * Requires: npm install qrcode
 */
export async function generateUPIQRCode(orderId, amount, payeeUpiId, payeeName, transactionNote) {
  try {
    const upiUrl = generateUPIUrl(orderId, amount, payeeUpiId, payeeName, transactionNote);
    
    // Dynamic import for QRCode (install with: npm install qrcode)
    let QRCode;
    try {
      QRCode = (await import('qrcode')).default;
    } catch (importError) {
      console.warn('QRCode package not installed. Install with: npm install qrcode');
      // Fallback: return UPI URL only
      return {
        qrCode: null,
        upiUrl: upiUrl,
        upiId: payeeUpiId || process.env.UPI_ID,
        amount: amount,
        orderId: orderId,
        error: 'QRCode package not installed'
      };
    }
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    return {
      qrCode: qrCodeDataUrl,
      upiUrl: upiUrl,
      upiId: payeeUpiId || process.env.UPI_ID,
      amount: amount,
      orderId: orderId
    };
  } catch (error) {
    console.error('Error generating UPI QR code:', error);
    // Fallback: return UPI URL only
    return {
      qrCode: null,
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
