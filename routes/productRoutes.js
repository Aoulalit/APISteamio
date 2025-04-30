const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.post('/islogged', async (req, res) => {
    const { mail } = req.body;

    if (!mail) {
        return res.status(400).json({ success: false, error: 'Email non fourni.' });
    }

    try {
        const [user] = await pool.query('SELECT * FROM utilisateur WHERE email = ?', [mail]);

        if (user.length === 0) {
            return res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la vérification de connexion:', error);
        res.status(500).json({ success: false, error: 'Erreur interne du serveur.' });
    }
});

router.get('/', async (req, res) => {
    const { sortBy } = req.query;  // Récupère le paramètre de tri envoyé depuis le front-end

    let query = 'SELECT * FROM produit';

    if (sortBy === 'nameAsc') {
        query += ' ORDER BY nom ASC';  // Trier par nom de A à Z
    } else if (sortBy === 'nameDesc') {
        query += ' ORDER BY nom DESC';  // Trier par nom de Z à A
    }

    try {
        const [rows] = await pool.query(query);
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
    const { nom, prix, caracteristiques, image } = req.body;

    if (!nom || !prix || !caracteristiques || !image) {
        return res.status(400).json({ error: 'Nom, prix, caractéristiques et image sont obligatoires.' });
    }

    const sql = 'UPDATE produit SET nom = ?, prix = ?, caracteristique = ?, image = ? WHERE id_produit = ?';

    try {
        console.log("Données reçues pour la mise à jour du produit:", { nom, prix, caracteristiques, image, id });
        await pool.query(sql, [nom, prix, caracteristiques, image, id]);
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
