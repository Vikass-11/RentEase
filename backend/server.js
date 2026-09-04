import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe'; 

import Product from './models/Product.js'; 
import Order from './models/Order.js'; 
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { requireAdmin } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/rentease';
const fallbackFrontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
const vercelProjectPrefix = (process.env.VERCEL_PROJECT_PREFIX || 'rent-ease-qw9b').trim();
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean),
];
const corsOrigins = [...new Set(allowedOrigins)];
const isAllowedOrigin = (origin) => {
    const normalizedOrigin = origin?.replace(/\/+$/, '');

    if (!normalizedOrigin) {
        return true;
    }

    if (corsOrigins.includes(normalizedOrigin)) {
        return true;
    }

    if (
        vercelProjectPrefix &&
        normalizedOrigin.startsWith(`https://${vercelProjectPrefix}`) &&
        normalizedOrigin.endsWith('.vercel.app')
    ) {
        return true;
    }

    return false;
};

app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
}));

mongoose.connect(mongoUri)
    .then(() => console.log('✅ RentEase Database Connected'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));



app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/api/products', async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice } = req.query;
        let filter = {};
        
        if (category && category !== 'All') {
            filter.category = category;
        }

        if (search) {
            filter.title = { $regex: search, $options: 'i' }; // Case-insensitive search
        }

        if (minPrice || maxPrice) {
            filter.monthlyRent = {};
            if (minPrice) filter.monthlyRent.$gte = Number(minPrice);
            if (maxPrice) filter.monthlyRent.$lte = Number(maxPrice);
        }

        const products = await Product.find(filter);
        res.json(products);
    } catch (error) {
        console.error('Fetch Products Error:', error);
        res.status(500).json({ message: "Server Error: Could not fetch products" });
    }
});

app.get('/api/products/owner/:email', async (req, res) => {
    try {
        const ownerEmail = req.params.email;
        const myProducts = await Product.find({ ownerEmail }).sort({ createdAt: -1 });
        res.json(myProducts);
    } catch (error) {
        console.error('Fetch Owner Products Error:', error);
        res.status(500).json({ message: "Server Error: Could not fetch your listings" });
    }
});

app.get('/api/products/unowned/count', async (req, res) => {
    try {
        const count = await Product.countDocuments({
            $or: [
                { ownerEmail: { $exists: false } },
                { ownerEmail: null },
                { ownerEmail: '' },
            ],
        });

        res.json({ count });
    } catch (error) {
        console.error('Fetch Unowned Products Count Error:', error);
        res.status(500).json({ message: "Server Error: Could not fetch unowned count" });
    }
});

app.post('/api/products/owner/:email/claim', async (req, res) => {
    try {
        const ownerEmail = req.params.email;
        const ownerName = req.body?.ownerName;

        if (!ownerEmail) {
            return res.status(400).json({ message: "Owner email is required." });
        }

        const result = await Product.updateMany(
            {
                $or: [
                    { ownerEmail: { $exists: false } },
                    { ownerEmail: null },
                    { ownerEmail: '' },
                ],
            },
            {
                $set: {
                    ownerEmail,
                    ...(ownerName ? { ownerName } : {}),
                },
            }
        );

        res.json({
            matchedCount: result.matchedCount ?? result.n ?? 0,
            modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
        });
    } catch (error) {
        console.error('Claim Owner Products Error:', error);
        res.status(500).json({ message: "Server Error: Could not claim listings" });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        console.error('Fetch Product Details Error:', error);
        res.status(500).json({ message: "Server Error: Could not fetch product details" });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error("Post Error:", error);
        res.status(400).json({ message: "Failed to list product." });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product removed from inventory" });
    } catch (error) {
        res.status(500).json({ message: "Server Error: Delete failed" });
    }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product removed from collection" });
    } catch (error) {
        console.error('Admin Delete Product Error:', error);
        res.status(500).json({ message: "Server Error: Admin delete failed" });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true } 
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(updatedProduct);
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Server Error: Update failed" });
    }
});


app.post('/api/stripe/create-checkout-session', async (req, res) => {
    try {
        const { items, userEmail } = req.body;
        const requestOrigin = req.headers.origin?.replace(/\/+$/, '');
        const frontendBaseUrl = requestOrigin && isAllowedOrigin(requestOrigin)
            ? requestOrigin
            : fallbackFrontendUrl;

        const lineItems = items.map((item) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                    images: [item.image],
                    description: `${item.tenure || 3} Month Lease | Security Deposit Included`,
                },
                // Stripe requires amounts in cents!
                unit_amount: (item.monthlyRent + item.securityDeposit) * 100,
            },
            quantity: 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: userEmail,
            line_items: lineItems,
            mode: 'payment',
            success_url: `${frontendBaseUrl}/success`,
            cancel_url: `${frontendBaseUrl}/checkout`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("Order Error:", error);
        res.status(400).json({ message: "Failed to place order." });
    }
});

app.get('/api/orders/:email', async (req, res) => {
    try {
        const userOrders = await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
        res.json(userOrders);
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        res.status(500).json({ message: "Failed to fetch user orders." });
    }
});


app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'RentEase Backend is awake!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 RentEase Backend running on port ${PORT}`);
});
