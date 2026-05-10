import Order from '../models/Order.js';
import { sendWhatsAppNotification } from '../services/whatsappService.js';

export const createOrder = async (req, res, next) => {
    try {
        const orderData = { ...req.body, isGuest: false };
        const order = new Order(orderData);
        
        // Blocking operation: Save to DB
        await order.save();

        // FIRE AND FORGET: Trigger WhatsApp notification without 'await'
        sendWhatsAppNotification(order).catch(err => 
            console.error('Non-blocking WhatsApp Error:', err.message)
        );

        // Immediate Response to client
        return res.status(201).json({
            success: true,
            orderId: order._id,
            message: 'Order placed successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const createGuestOrder = async (req, res, next) => {
    try {
        const orderData = { ...req.body, isGuest: true };
        const order = new Order(orderData);
        
        await order.save();

        // FIRE AND FORGET
        sendWhatsAppNotification(order).catch(err => 
            console.error('Non-blocking WhatsApp Error (Guest):', err.message)
        );

        return res.status(201).json({
            success: true,
            orderId: order._id,
            message: 'Guest order placed successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        return res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};