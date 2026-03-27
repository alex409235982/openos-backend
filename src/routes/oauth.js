import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';
import { sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();

router.get('/google', (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile`;
    res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    
    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenResponse.data;
        
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { email, name, id } = userResponse.data;

        let user = await User.findOne({ email });
        
        if (!user) {
            user = new User({
                name,
                email,
                oauthProvider: 'google',
                oauthId: id,
                password: null
            });
            await user.save();
            await sendWelcomeEmail(email, name);
        } else if (!user.oauthId) {
            user.oauthProvider = 'google';
            user.oauthId = id;
            await user.save();
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
});

router.get('/github', (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`;
    res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
    const { code } = req.query;
    
    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            code,
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            redirect_uri: process.env.GITHUB_REDIRECT_URI
        }, {
            headers: { Accept: 'application/json' }
        });

        const { access_token } = tokenResponse.data;
        
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const emailResponse = await axios.get('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const primaryEmail = emailResponse.data.find(email => email.primary)?.email || emailResponse.data[0]?.email;
        const { name, id } = userResponse.data;

        let user = await User.findOne({ email: primaryEmail });
        
        if (!user) {
            user = new User({
                name: name || primaryEmail.split('@')[0],
                email: primaryEmail,
                oauthProvider: 'github',
                oauthId: String(id),
                password: null
            });
            await user.save();
            await sendWelcomeEmail(primaryEmail, name || primaryEmail.split('@')[0]);
        } else if (!user.oauthId) {
            user.oauthProvider = 'github';
            user.oauthId = String(id);
            await user.save();
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
});

router.get('/discord', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.DISCORD_REDIRECT_URI}&response_type=code&scope=identify%20email`;
    res.redirect(url);
});

router.get('/discord/callback', async (req, res) => {
    const { code } = req.query;
    
    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.DISCORD_REDIRECT_URI
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token } = tokenResponse.data;
        
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { email, username, id } = userResponse.data;

        let user = await User.findOne({ email });
        
        if (!user) {
            user = new User({
                name: username,
                email,
                oauthProvider: 'discord',
                oauthId: id,
                password: null
            });
            await user.save();
            await sendWelcomeEmail(email, username);
        } else if (!user.oauthId) {
            user.oauthProvider = 'discord';
            user.oauthId = id;
            await user.save();
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
    } catch (error) {
        console.error('Discord OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
});

export default router;