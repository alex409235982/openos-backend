import express from 'express';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import Stripe from 'stripe';
import User from '../models/User.js';
import Session from '../models/Session.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/profile-picture', authenticateToken, async (req, res, next) => {
    try {
        const { image, twoFactorCode } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: 'Image data is required' });
        }
        
        if (req.user.twoFactorEnabled && !twoFactorCode) {
            return res.status(401).json({ error: '2FA_REQUIRED' });
        }
        
        if (req.user.twoFactorEnabled && twoFactorCode) {
            const verified = speakeasy.totp.verify({
                secret: req.user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 1
            });
            if (!verified) {
                return res.status(401).json({ error: 'Invalid code' });
            }
        }
        
        req.user.profilePicture = image;
        await req.user.save();
        
        res.json({ profilePicture: req.user.profilePicture });
    } catch (error) {
        next(error);
    }
});

router.delete('/profile-picture', authenticateToken, async (req, res, next) => {
    try {
        const { twoFactorCode } = req.body;
        
        if (req.user.twoFactorEnabled && !twoFactorCode) {
            return res.status(401).json({ error: '2FA_REQUIRED' });
        }
        
        if (req.user.twoFactorEnabled && twoFactorCode) {
            const verified = speakeasy.totp.verify({
                secret: req.user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 1
            });
            if (!verified) {
                return res.status(401).json({ error: 'Invalid code' });
            }
        }
        
        req.user.profilePicture = null;
        await req.user.save();
        
        res.json({ message: 'Profile picture removed' });
    } catch (error) {
        next(error);
    }
});

router.put('/email', authenticateToken, async (req, res, next) => {
    try {
        const { email, currentPassword, twoFactorCode } = req.body;
        
        if (!email || !currentPassword) {
            return res.status(400).json({ error: 'Email and current password are required' });
        }
        
        if (req.user.twoFactorEnabled && !twoFactorCode) {
            return res.status(401).json({ error: '2FA_REQUIRED' });
        }
        
        const isValid = await req.user.comparePassword(currentPassword);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        if (req.user.twoFactorEnabled && twoFactorCode) {
            const verified = speakeasy.totp.verify({
                secret: req.user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 1
            });
            if (!verified) {
                return res.status(401).json({ error: 'Invalid code' });
            }
        }
        
        const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        
        req.user.email = email;
        await req.user.save();
        
        res.json({ email: req.user.email });
    } catch (error) {
        next(error);
    }
});

router.put('/password', authenticateToken, async (req, res, next) => {
    try {
        const { currentPassword, newPassword, twoFactorCode } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }
        
        if (req.user.twoFactorEnabled && !twoFactorCode) {
            return res.status(401).json({ error: '2FA_REQUIRED' });
        }
        
        const isValid = await req.user.comparePassword(currentPassword);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid current password' });
        }
        
        if (req.user.twoFactorEnabled && twoFactorCode) {
            const verified = speakeasy.totp.verify({
                secret: req.user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 1
            });
            if (!verified) {
                return res.status(401).json({ error: 'Invalid code' });
            }
        }
        
        req.user.password = newPassword;
        await req.user.save();
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
});

router.post('/2fa/enable', authenticateToken, async (req, res, next) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `OPENOS:${req.user.email}`
        });
        
        req.user.twoFactorSecret = secret.base32;
        await req.user.save();
        
        const otpauthUrl = secret.otpauth_url;
        
        res.json({ 
            secret: secret.base32, 
            otpauthUrl
        });
    } catch (error) {
        next(error);
    }
});

router.post('/2fa/verify', authenticateToken, async (req, res, next) => {
    try {
        const { code, secret } = req.body;
        
        if (!code || !secret) {
            return res.status(400).json({ error: 'Code and secret are required' });
        }
        
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: code
        });
        
        if (!verified) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        
        req.user.twoFactorEnabled = true;
        await req.user.save();
        
        res.json({ message: '2FA enabled successfully' });
    } catch (error) {
        next(error);
    }
});

router.post('/2fa/disable', authenticateToken, async (req, res, next) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: '2FA code is required' });
        }
        
        const verified = speakeasy.totp.verify({
            secret: req.user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 1
        });
        
        if (!verified) {
            return res.status(401).json({ error: 'Invalid code' });
        }
        
        req.user.twoFactorEnabled = false;
        req.user.twoFactorSecret = null;
        await req.user.save();
        
        res.json({ message: '2FA disabled successfully' });
    } catch (error) {
        next(error);
    }
});

router.get('/2fa/status', authenticateToken, async (req, res, next) => {
    try {
        res.json({ 
            enabled: req.user.twoFactorEnabled,
            hasSecret: !!req.user.twoFactorSecret
        });
    } catch (error) {
        next(error);
    }
});

router.post('/oauth/disconnect', authenticateToken, async (req, res, next) => {
    try {
        const { provider, twoFactorCode } = req.body;
        
        if (req.user.oauthProvider !== provider) {
            return res.status(400).json({ error: 'Provider not connected' });
        }
        
        const hasValidPassword = req.user.password && req.user.password.length > 0;
        
        if (!hasValidPassword) {
            return res.status(400).json({ error: 'Please set a password before disconnecting OAuth' });
        }
        
        if (req.user.twoFactorEnabled && !twoFactorCode) {
            return res.status(401).json({ error: '2FA_REQUIRED' });
        }
        
        if (req.user.twoFactorEnabled && twoFactorCode) {
            const verified = speakeasy.totp.verify({
                secret: req.user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 1
            });
            if (!verified) {
                return res.status(401).json({ error: 'Invalid code' });
            }
        }
        
        req.user.oauthProvider = null;
        req.user.oauthId = null;
        await req.user.save();
        
        res.json({ message: `${provider} disconnected` });
    } catch (error) {
        next(error);
    }
});

router.put('/preferences', authenticateToken, async (req, res, next) => {
    try {
        const { theme, blurLevel } = req.body;
        
        if (theme && !['light', 'dark'].includes(theme)) {
            return res.status(400).json({ error: 'Invalid theme value' });
        }
        
        if (blurLevel !== undefined && (blurLevel < 0 || blurLevel > 4)) {
            return res.status(400).json({ error: 'Invalid blur level' });
        }
        
        if (!req.user.preferences) {
            req.user.preferences = {};
        }
        
        if (theme) req.user.preferences.theme = theme;
        if (blurLevel !== undefined) req.user.preferences.blurLevel = blurLevel;
        
        await req.user.save();
        
        res.json({ 
            message: 'Preferences updated',
            preferences: req.user.preferences
        });
    } catch (error) {
        next(error);
    }
});

router.get('/billing', authenticateToken, async (req, res, next) => {
    try {
        const user = req.user;
        
        if (user.plan !== 'premium') {
            return res.json({ plan: 'free' });
        }
        
        const billingInfo = {
            plan: 'premium',
            paymentMethod: null,
            expiresAt: null,
            stripePortalUrl: null
        };
        
        const latestSession = await Session.findOne({ userId: user._id }).sort({ createdAt: -1 });
        if (latestSession && latestSession.createdAt) {
            const expiresAt = new Date(latestSession.createdAt);
            expiresAt.setMonth(expiresAt.getMonth() + 1);
            billingInfo.expiresAt = expiresAt;
        } else {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);
            billingInfo.expiresAt = expiresAt;
        }
        
        if (user.stripeCustomerId) {
            billingInfo.paymentMethod = 'stripe';
            try {
                const portalSession = await stripe.billingPortal.sessions.create({
                    customer: user.stripeCustomerId,
                    return_url: `${process.env.FRONTEND_URL}/dashboard`,
                });
                billingInfo.stripePortalUrl = portalSession.url;
            } catch (err) {
                console.error('Failed to create portal session:', err);
            }
        } else {
            billingInfo.paymentMethod = 'crypto';
        }
        
        res.json(billingInfo);
    } catch (error) {
        next(error);
    }
});

router.delete('/account', authenticateToken, async (req, res, next) => {
    try {
        const { twoFactorCode } = req.body;
        
        if (req.user.twoFactorEnabled) {
            if (!twoFactorCode) {
                return res.status(401).json({ error: '2FA_REQUIRED' });
            }
            
            const verified = speakeasy.totp.verify({
                secret: req.user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 1
            });
            if (!verified) {
                return res.status(401).json({ error: 'Invalid code' });
            }
        }
        
        await Session.deleteMany({ userId: req.user._id });
        await PasswordResetToken.deleteMany({ userId: req.user._id });
        await User.deleteOne({ _id: req.user._id });
        
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;