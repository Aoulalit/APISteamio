// server.js
const express = require('express');
const bodyParser = require('body-parser');
const corsMiddleware = require('./middlewares/corsMiddleware');
const { pool } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(corsMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);  // Utilisez un préfixe de route
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// Démarre le serveur
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
