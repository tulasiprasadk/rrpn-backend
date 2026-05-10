import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    console.log("Mongo URI Exists:", !!process.env.MONGODB_URI);

    try {
        const db = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = db.connections[0].readyState;
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        // In serverless, we don't necessarily want to exit process, 
        // but we want to log the failure clearly.
    }
};

mongoose.connection.on('disconnected', () => { isConnected = false; });
mongoose.connection.on('error', (err) => { console.error('Mongoose error:', err); });