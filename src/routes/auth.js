import express from 'express';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import speakeasy from 'speakeasy';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();

router.post('/signup', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        await sendWelcomeEmail(email, name);

        res.status(201).json({
            accessToken: token,
            user: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password, remember, twoFactorCode } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.password) {
            return res.status(401).json({ error: 'Please login with ' + user.oauthProvider });
        }

        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.twoFactorEnabled) {
            if (!twoFactorCode) {
                return res.status(401).json({ error: '2FA_REQUIRED' });
            }

            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 1
            });

            if (!verified) {
                return res.status(401).json({ error: 'Invalid code' });
            }
        }

        const expiresIn = remember ? '30d' : '7d';
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        res.json({
            accessToken: token,
            user: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

router.post('/password/forgot', async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        await PasswordResetToken.deleteMany({ userId: user._id });

        const token = nanoid(32);
        const resetToken = new PasswordResetToken({
            userId: user._id,
            token
        });

        await resetToken.save();
        await sendPasswordResetEmail(email, token);

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        next(error);
    }
});

router.post('/password/reset', async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Reset token is required' });
        }

        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        const resetToken = await PasswordResetToken.findOne({ token });
        if (!resetToken) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        if (resetToken.expiresAt < new Date()) {
            await resetToken.deleteOne();
            return res.status(400).json({ error: 'Reset token has expired' });
        }

        const user = await User.findById(resetToken.userId);
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        await resetToken.deleteOne();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        next(error);
    }
});

export default router;