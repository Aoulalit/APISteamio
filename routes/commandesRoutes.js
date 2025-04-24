const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * ➤ Récupérer les commandes confirmées d'un utilisateur
 */

router.get('/', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email requis.' });
    }

    try {
        console.log("→ getConfirmedOrders called with email =", email);

        const query = `
            SELECT 
                cv.id_commande, 
                cv.date_validation, 
                SUM(pp.quantite) AS quantite,
                SUM(pp.quantite * p.prix) AS prix_total
            FROM commandes_validees cv
            JOIN panier pa ON cv.id_commande = pa.id_commande
            JOIN panier_produit pp ON pa.id_panier = pp.id_panier
            JOIN produit p ON pp.id_produit = p.id_produit
            WHERE cv.email = ?
            GROUP BY cv.id_commande, cv.date_validation
            ORDER BY cv.date_validation DESC
        `;

        const [rows] = await pool.query(query, [email]);

        console.log("→ getConfirmedOrders result:", rows);

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Erreur lors de la récupération des commandes validées:", error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

module.exports = router;
