require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─── Database Initialization ────────────────────────────────────────────────

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100),
        pincode VARCHAR(10),
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'COD',
        status VARCHAR(50) DEFAULT 'Placed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(255),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed products if empty
    const result = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(result.rows[0].count) === 0) {
      const cars = [
        { name: "Twin Mill", price: 299, image: "/images/1.jpeg", desc: "The iconic Twin Mill with dual engines and aggressive styling. A Hot Wheels legend since 1969." },
        { name: "Bone Shaker", price: 349, image: "/images/2.jpeg", desc: "A hot rod with a skull grille that screams attitude. One of the most popular fantasy castings." },
        { name: "Deora II", price: 399, image: "/images/3.jpeg", desc: "A futuristic surf wagon concept. Sleek, stylish, and absolutely radical." },
        { name: "Rodger Dodger", price: 279, image: "/images/4.jpeg", desc: "Classic muscle car vibes with a massive engine scoop. Pure American power." },
        { name: "Nissan GT-R R35", price: 449, image: "/images/5.jpeg", desc: "Godzilla in die-cast form. Japanese engineering meets Hot Wheels precision." },
        { name: "Tesla Roadster", price: 499, image: "/images/6.jpeg", desc: "The electric future in miniature. Sleek design, zero emissions, maximum cool." },
        { name: "Lamborghini Veneno", price: 549, image: "/images/7.jpeg", desc: "Italian supercar perfection. Sharp angles and blistering speed in 1:64 scale." },
        { name: "Ford Mustang GT", price: 329, image: "/images/8.jpeg", desc: "America's pony car in Hot Wheels form. Classic style with modern muscle." },
        { name: "Porsche 911 GT3", price: 479, image: "/images/9.jpeg", desc: "German precision engineering. Track-ready performance in your palm." },
        { name: "BMW M3 GTR", price: 429, image: "/images/10.jpeg", desc: "The legendary Need for Speed icon. Racing heritage meets collector appeal." }
      ];

      for (const car of cars) {
        await client.query(
          'INSERT INTO products (name, price, image_url, description) VALUES ($1, $2, $3, $4)',
          [car.name, car.price, car.image, car.desc]
        );
      }
      console.log('✅ Seeded 10 Hot Wheels products');
    }

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  } finally {
    client.release();
  }
}

// ─── API Routes ─────────────────────────────────────────────────────────────

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Place an order
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customerName, phone, address, city, pincode, items, total } = req.body;

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, phone, address, city, pincode, total, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, 'COD') RETURNING id`,
      [customerName, phone, address, city, pincode, total]
    );
    const orderId = orderResult.rows[0].id;

    // Insert order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.id, item.name, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');

    // Send order confirmation email to store owner
    try {
      const itemsList = items.map(i => `${i.name} x${i.quantity} — ₹${(i.price * i.quantity).toFixed(2)}`).join('\n');
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `🔥 New Order #${orderId} — Taarun's Hotwheels`,
        text: `New order received!\n\nCustomer: ${customerName}\nPhone: ${phone}\nAddress: ${address}, ${city} - ${pincode}\n\nItems:\n${itemsList}\n\nTotal: ₹${total}\nPayment: Cash on Delivery`
      });
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr.message);
    }

    res.json({ success: true, orderId, message: 'Order placed successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    client.release();
  }
});

// Contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Save to database
    await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `📩 New Contact Message — Taarun's Hotwheels`,
      text: `New message from your website!\n\nFrom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    });

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ─── Start Server ───────────────────────────────────────────────────────────

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🔥 Taarun's Hotwheels server running on http://localhost:${PORT}`);
  });
});

module.exports = app;
