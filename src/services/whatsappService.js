import axios from 'axios';

export const sendWhatsAppNotification = async (order) => {
    const { WHATSAPP_API_URL, WHATSAPP_TOKEN } = process.env;

    if (!WHATSAPP_API_URL || WHATSAPP_API_URL.includes('placeholder')) {
        console.log('WhatsApp Service: Skipping (API URL not configured)');
        return;
    }

    const orderIdShort = order._id.toString().slice(-6).toUpperCase();
    const payload = {
        phone: order.customer.phone,
        message: `Hello ${order.customer.name}, your order ${orderIdShort} for ₹${order.totalAmount} has been received!`
    };

    return axios.post(WHATSAPP_API_URL, payload, {
        headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
        },
        timeout: 3000 // Ensure internal API lag doesn't hang the process
    });
};