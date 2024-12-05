const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.post('/islogged', (req, res) => {
    const { mail } = req.body;
    if (mail) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

router.get('/', async (req, res) => {  // Utilisation de '/' pour correspondre à '/api/products'
    try {
        const [rows] = await pool.query('SELECT * FROM produit');
        res.json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

router.post('/addproduct', async (req, res) => {
    const { nom, prix, caracteristique } = req.body;

    console.log(req.body);

    if (!nom || !prix || !caracteristique) {
        return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
    }


    try {
        const query = `INSERT INTO produit (nom, prix, caracteristique) VALUES (?, ?, ?)`;
        await pool.query(query, [nom, prix, caracteristique]);
        res.status(201).json({ message: 'Produit ajouté avec succès' });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du produit:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du produit' });
    }
});

router.put('/editproduct/:id', async (req, res) => {
    const id = req.params.id;
    const { nom, prix, caracteristiques } = req.body;
    console.log(req.body, id);

    if (!nom || !prix || !caracteristiques) {
        return res.status(400).json({ error: 'Nom, prix et caractéristiques sont obligatoires.' });
    }

    const sql = 'UPDATE produit SET nom = ?, prix = ?, caracteristique = ? WHERE id_produit = ?';

    try {
        console.log("Données reçues pour la mise à jour du produit:", { nom, prix, caracteristiques, id });
        await pool.query(sql, [nom, prix, caracteristiques, id]);
        res.json({ message: 'Produit mis à jour avec succès' });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du produit:', err);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});



router.delete('/deleteproduct', async (req, res) => {
    try {
        const { id } = req.query;
        console.log(`Tentative de suppression du produit avec ID: ${id}`); // Log de l'ID
        const [result] = await pool.query('DELETE FROM produit WHERE id_produit = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produit non trouvé.' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});



module.exports = router;
