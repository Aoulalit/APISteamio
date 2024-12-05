const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.post('/addToCart', async (req, res) => {
    try {
        const { id_produit, nom, date, quantite } = req.body;
        const [user] = await pool.query('SELECT id_utilisateur FROM utilisateur WHERE email = ?', [nom]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }
        const userId = user[0].id_utilisateur;

        const [cart] = await pool.query('SELECT * FROM panier WHERE id_utilisateur = ? AND status = ?', [userId, 'active']);
        let cartId;
        if (cart.length === 0) {
            const [result] = await pool.query('INSERT INTO panier (id_utilisateur) VALUES (?)', [userId]);
            cartId = result.insertId;
        } else {
            cartId = cart[0].id_panier;
        }

        const [existingProduct] = await pool.query('SELECT * FROM panier_produit WHERE id_panier = ? AND id_produit = ?', [cartId, id_produit]);
        if (existingProduct.length > 0) {
            await pool.query('UPDATE panier_produit SET quantite = quantite + ? WHERE id_panier = ? AND id_produit = ?', [quantite, cartId, id_produit]);
        } else {
            await pool.query('INSERT INTO panier_produit (id_panier, id_produit, quantite) VALUES (?, ?, ?)', [cartId, id_produit, quantite]);
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erreur lors de l\'ajout au panier:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

router.post('/confirmCart', async (req, res) => {
    try {
        const { email, cart } = req.body;

        const [user] = await pool.query('SELECT id_utilisateur FROM utilisateur WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }
        const userId = user[0].id_utilisateur;

        const [result] = await pool.query('INSERT INTO panier (id_utilisateur, status) VALUES (?, ?)', [userId, 'confirmed']);
        const cartId = result.insertId;

        const cartPromises = cart.map(item => {
            return pool.query('INSERT INTO panier_produit (id_panier, id_produit, quantite) VALUES (?, ?, ?)',
                [cartId, item.id_produit, item.quantite]);
        });

        await Promise.all(cartPromises);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la confirmation du panier:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

module.exports = router;
