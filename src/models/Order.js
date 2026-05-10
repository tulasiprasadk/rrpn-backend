import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    items: [{
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String
    }],
    totalAmount: { type: Number, required: true },
    customer: {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String, required: true },
        address: String
    },
    isGuest: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['pending', 'paid', 'processing', 'delivered', 'cancelled'], 
        default: 'pending' 
    },
    paymentMethod: { type: String, default: 'cod' },
    createdAt: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    minimize: false 
});

// Indexes for performance
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'customer.phone': 1 });
OrderSchema.index({ status: 1 });

// Virtual for formatted ID
OrderSchema.virtual('orderId').get(function() {
    return this._id.toString().slice(-6).toUpperCase();
});

export default mongoose.model('Order', OrderSchema);