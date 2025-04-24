const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * ➤ Récupérer les produits du panier d'un utilisateur
 *    On inclut p.id_produit dans le SELECT pour que Flutter reçoive un champ 'id_produit'
 */
router.get('/getCart', async (req, res) => {
    const { id_utilisateur } = req.query;

    if (!id_utilisateur) {
        return res.status(400).json({ error: 'ID utilisateur requis.' });
    }

    try {
        console.log("→ getCart called with id_utilisateur =", id_utilisateur);

        const query = `
            SELECT p.id_produit, p.nom, p.prix, p.image, pp.quantite
            FROM panier_produit pp
            JOIN produit p ON pp.id_produit = p.id_produit
            JOIN panier pa ON pp.id_panier = pa.id_panier
            WHERE pa.id_utilisateur = ?
        `;
        const [rows] = await pool.query(query, [id_utilisateur]);

        console.log("→ getCart result:", rows);

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Erreur lors de la récupération du panier:", error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

/**
 * ➤ Supprimer un produit du panier
 *    On utilise l'ID utilisateur et l'ID produit pour cibler la bonne ligne.
 */
router.delete('/removeFromCart', async (req, res) => {
    console.log("→ removeFromCart called with query:", req.query);

    const { id_utilisateur, id_produit } = req.query;

    if (!id_utilisateur || !id_produit) {
        console.log("→ Missing params:", id_utilisateur, id_produit);
        return res.status(400).json({ error: 'ID utilisateur et ID produit requis.' });
    }

    try {
        const query = `
            DELETE FROM panier_produit 
            WHERE id_panier = (
                SELECT id_panier 
                FROM panier 
                WHERE id_utilisateur = ?
                LIMIT 1
            )
            AND id_produit = ?
        `;
        const [result] = await pool.query(query, [id_utilisateur, id_produit]);

        console.log("→ Delete result:", result);
        // result.affectedRows > 0 => produit supprimé

        return res.status(200).json({ message: 'Produit retiré du panier avec succès.' });
    } catch (error) {
        console.error("Erreur lors de la suppression du produit du panier:", error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

/**
 * ➤ Ajouter un produit au panier
 */
router.post('/addToCart', async (req, res) => {
    const { id_utilisateur, id_produit, quantite } = req.body;

    try {
        console.log("→ addToCart called with body:", req.body);

        // Vérifier si l'utilisateur existe
        const [user] = await pool.query(
            'SELECT * FROM utilisateur WHERE id_utilisateur = ?',
            [id_utilisateur]
        );
        if (user.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        // Vérifier si un panier existe pour cet utilisateur
        let [panier] = await pool.query(
            'SELECT id_panier FROM panier WHERE id_utilisateur = ?',
            [id_utilisateur]
        );

        // Si aucun panier, on en crée un
        if (panier.length === 0) {
            const [result] = await pool.query(
                'INSERT INTO panier (id_utilisateur) VALUES (?)',
                [id_utilisateur]
            );
            panier = [{ id_panier: result.insertId }];
        }

        const id_panier = panier[0].id_panier;

        // Ajouter le produit au panier
        const insertQuery = `
            INSERT INTO panier_produit (id_panier, id_produit, quantite)
            VALUES (?, ?, ?)
        `;
        const [insertResult] = await pool.query(
            insertQuery,
            [id_panier, id_produit, quantite]
        );

        console.log("→ addToCart insertResult:", insertResult);

        return res.status(201).json({ success: true, message: 'Produit ajouté au panier.' });
    } catch (error) {
        console.error("Erreur lors de l'ajout au panier:", error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

/**
 * ➤ Confirmer le panier d'un utilisateur
 *    ➤ On ajoute l'insertion dans la table "commandes_validees" pour stocker l'email.
 */
router.post('/confirmCart', async (req, res) => {
    try {
        console.log("→ confirmCart called with body:", req.body);

        const { email, cart } = req.body;

        // Vérifier si l'utilisateur existe
        const [user] = await pool.query(
            'SELECT id_utilisateur FROM utilisateur WHERE email = ?',
            [email]
        );
        if (user.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }
        const userId = user[0].id_utilisateur;

        // Créer un panier "confirmed"
        const [result] = await pool.query(
            'update  panier set status = ?',
            ['confirmed']
        );
        console.log(cart)


        // ➤ Enregistrer l'email dans la table "commandes_validees"
        await pool.query(
            'INSERT INTO commandes_validees (email) VALUES (?)',
            [email]
        );
        console.log(cart.map((c) => {
            return c.id_produit
        }).join(","))

        await pool.query(
            'delete from panier_produit where id_produit in (?)',
            [cart.map((c) => {
                return c.id_produit
            }).join(",")]
        )

        console.log("→ confirmCart success - email enregistré dans commandes_validees");

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Erreur lors de la confirmation du panier:", error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

/**
 * ➤ Mettre à jour la quantité d'un produit (incrément/décrément)
 */
router.patch('/updateQuantity', async (req, res) => {
    try {
        const { id_utilisateur, id_produit, nouvelleQuantite } = req.body;

        if (!id_utilisateur || !id_produit || nouvelleQuantite == null) {
            return res.status(400).json({ error: 'Paramètres manquants.' });
        }

        // Récupérer le panier correspondant à l'utilisateur
        const [panier] = await pool.query(
            'SELECT id_panier FROM panier WHERE id_utilisateur = ? LIMIT 1',
            [id_utilisateur]
        );

        if (panier.length === 0) {
            return res.status(404).json({ error: 'Aucun panier trouvé pour cet utilisateur.' });
        }

        const id_panier = panier[0].id_panier;

        if (nouvelleQuantite <= 0) {
            // Si la nouvelle quantité est 0 ou moins, on supprime le produit
            await pool.query(
                'DELETE FROM panier_produit WHERE id_panier = ? AND id_produit = ?',
                [id_panier, id_produit]
            );
            return res.status(200).json({ message: 'Produit retiré (quantité 0).' });
        } else {
            // Sinon, on met à jour la quantité
            const [result] = await pool.query(
                'UPDATE panier_produit SET quantite = ? WHERE id_panier = ? AND id_produit = ?',
                [nouvelleQuantite, id_panier, id_produit]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Produit introuvable dans le panier.' });
            }
            return res.status(200).json({ message: 'Quantité mise à jour avec succès.' });
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la quantité:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

router.patch('/updateQuantityReact', async (req, res) => {
    try {
        const { id_produit, nouvelleQuantite } = req.body;

        if (!id_produit || nouvelleQuantite == null) {
            return res.status(400).json({ error: 'Paramètres manquants.' });
        }

        // Mise à jour de la quantité directement dans la table produit
        const [result] = await pool.query(
            'UPDATE produit SET quantite = ? WHERE id_produit = ?',
            [nouvelleQuantite, id_produit]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produit introuvable.' });
        }
        return res.status(200).json({ message: 'Quantité mise à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la quantité pour React:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});


/**
 * ➤ Mettre à jour les caractéristiques d'un produit
 *    Permet de modifier le nom, la description, ou le prix d'un produit.
 */
router.patch('/updateCaraReact', async (req, res) => {
    try {
        const { id_produit, nom, description, prix } = req.body;

        // Vérification des paramètres
        if (!id_produit || !nom || !description || !prix) {
            return res.status(400).json({ error: 'Paramètres manquants : id_produit, nom, description, prix.' });
        }

        // Vérifier si le produit existe
        const [product] = await pool.query('SELECT * FROM produit WHERE id_produit = ?', [id_produit]);

        if (product.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé.' });
        }

        // Mettre à jour les caractéristiques du produit
        const query = `
            UPDATE produit
            SET nom = ?, description = ?, prix = ?
            WHERE id_produit = ?
        `;

        const [result] = await pool.query(query, [nom, description, prix, id_produit]);

        if (result.affectedRows === 0) {
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du produit.' });
        }

        return res.status(200).json({ success: true, message: 'Caractéristiques du produit mises à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des caractéristiques du produit:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

module.exports = router;