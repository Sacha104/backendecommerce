require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static('frontend'));

app.post('/create-checkout-session', async (req, res) => {
    const { items } = req.body;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100, // Convert to cents
            },
            quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${process.env.BASE_URL}/success.html`,
        cancel_url: `${process.env.BASE_URL}/cancel.html`,
    });

    res.json({ id: session.id });
});

app.post('/send-order-email', (req, res) => {
    const { orderDetails } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.SUPPLIER_EMAIL,
        subject: 'Nouvelle Commande',
        text: `Nouvelle commande: ${JSON.stringify(orderDetails)}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.status(200).send('Commande envoyée');
    });
});

app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});

