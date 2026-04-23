import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './utils/db.js';
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import healthRoutes from './routes/health.js';
import distrosRoutes from './routes/distros.js';
import glossaryRoutes from './routes/glossary.js';
import sessionRoutes from './routes/sessions.js';
import userRoutes from './routes/users.js';
import tutorialRoutes from './routes/tutorials.js';
import premiumRoutes from './routes/premium.js';
import favoriteRoutes from './routes/favorites.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://tryopenos.me',
            'https://tryopenos.me/',
            'http://localhost:5173',
            'http://localhost:5173/'
        ];

        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use('/api/premium/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('Database connection failed:', err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/distros', distrosRoutes);
app.use('/api/glossary', glossaryRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/favorites', favoriteRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'OPENOS API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            error: messages.join(', ')
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            error: `${field} already exists`
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired'
        });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;