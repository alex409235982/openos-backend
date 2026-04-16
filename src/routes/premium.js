import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.get('/prices', async (req, res) => {
  try {
    res.json({
      monthly: {
        price: 1.99,
        currency: 'usd',
        priceId: 'price_free'
      },
      crypto: {
        price: 1.99,
        currency: 'usd',
        moneroAddress: '48Vrti8AbJNfyysFPz9VsvZZviwnAguSvPbZqApz8RGuECfSuHhKgzgdZmq7rRj5i7jf8AguAgSdsMVobZk65u554JpKK9q',
        network: 'monero'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-checkout', authenticateToken, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'OPENOS Premium',
            description: 'Unlimited session time, priority access, and more',
          },
          unit_amount: 199,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/premium?session_id={CHECKOUT_SESSION_ID}&stripe_success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/premium`,
      customer_email: req.user.email,
      metadata: {
        userId: req.user._id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const customerId = session.customer;

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.plan = 'premium';
        user.stripeCustomerId = customerId;
        await user.save();
      }
    }
  }

  res.json({ received: true });
});

router.get('/verify-stripe', authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.json({ success: false, plan: req.user.plan });
    }
    
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
    
    if (checkoutSession.payment_status === 'paid') {
      const userId = checkoutSession.metadata.userId;
      
      if (userId === req.user._id.toString()) {
        req.user.plan = 'premium';
        req.user.stripeCustomerId = checkoutSession.customer;
        await req.user.save();
        return res.json({ success: true, plan: 'premium' });
      }
    }
    
    res.json({ success: false, plan: req.user.plan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/crypto-confirm', authenticateToken, async (req, res) => {
  try {
    const { txid } = req.body;
    
    if (!txid) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }
    
    req.user.plan = 'premium';
    await req.user.save();
    
    res.json({ 
      success: true, 
      message: 'Premium activated',
      plan: 'premium',
      transactionId: txid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;