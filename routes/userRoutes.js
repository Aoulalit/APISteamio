const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.get('/utilisateur', async (req, res) => {
    try {
        const { id } = req.query;
        const [result] = await pool.query('SELECT email FROM utilisateur WHERE id_utilisateur = ?', [id]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

router.get('/utilisateurs', async (req, res) => {
    try {
        console.log("Requête reçue pour /utilisateurs");
        const [result] = await pool.query('SELECT id_utilisateur, email, admin FROM utilisateur');
        console.log(result);
        res.status(200).json(result);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});



router.put('/edit', async (req, res) => {
    try {
        const { id, email, motdepasse, admin } = req.body;
        const [user] = await pool.query('SELECT * FROM utilisateur WHERE id_utilisateur = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        let hashedPassword = user[0].motdepasse;
        if (motdepasse) {
            hashedPassword = await bcrypt.hash(motdepasse, 10);
        }

        await pool.query('UPDATE utilisateur SET email = ?, motdepasse = ?, admin = ? WHERE id_utilisateur = ?', [email, hashedPassword, admin, id]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

module.exports = router;
