import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
    if (cached.conn) {
        console.log('Using cached MongoDB connection');
        return cached.conn;
    }

    if (!cached.promise) {
        console.log('Creating new MongoDB connection...');

        const opts = {
            bufferCommands: true,
            serverSelectionTimeoutMS: 5000
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
        .then((mongoose) => {
            console.log('MongoDB connected successfully');
            return mongoose;
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err.message);
            cached.promise = null;
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}
