const express = require('express');
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
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
        const [result] = await pool.query('SELECT id_utilisateur, email, admin FROM utilisateur');
        res.status(200).json(result);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

router.post('/login', async (req, res) => {
    try {
      const { email, motdepasse } = req.body;
  
      // Vérifie si l'utilisateur existe dans la base de données
      const [user] = await pool.query('SELECT * FROM utilisateur WHERE email = ?', [email]);
  
      if (user.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }
  
      // Compare le mot de passe
      const passwordMatch = await bcrypt.compare(motdepasse, user[0].motdepasse);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Mot de passe incorrect.' });
      }
  
      // Connexion réussie, renvoie les données utilisateur (ex: ID et email)
      res.status(200).json({
        success: true,
        id: user[0].id_utilisateur,
        email: user[0].email,
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
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
router.post('/changePassword', async (req, res) => {
    try {
      const { email, oldPassword, newPassword } = req.body;
  
      // Récupérer l'utilisateur
      const [user] = await pool.query('SELECT * FROM utilisateur WHERE email = ?', [email]);
      
      if (user.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }
  
      // Comparer l'ancien mot de passe
      const passwordMatch = await bcrypt.compare(oldPassword, user[0].motdepasse);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Ancien mot de passe incorrect.' });
      }
  
      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE utilisateur SET motdepasse = ? WHERE email = ?', [hashedPassword, email]);
  
      res.status(200).json({ success: true, message: 'Mot de passe changé avec succès.' });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  });

// Récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT id_utilisateur, email, admin FROM utilisateur');
        res.status(200).json(result);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

// Ajouter un nouvel utilisateur
router.post('/user', async (req, res) => {
    try {
        const { email, motdepasse, admin } = req.body;

        if (!email || !motdepasse) {
            return res.status(400).json({ error: 'Email et mot de passe sont obligatoires.' });
        }

        const hashedPassword = await bcrypt.hash(motdepasse, 10);
        await pool.query(
            'INSERT INTO utilisateur (email, motdepasse, admin) VALUES (?, ?, ?)',
            [email, hashedPassword, admin]
        );

        res.status(201).json({ success: true, message: 'Utilisateur ajouté avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'utilisateur :', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

// Modifier un utilisateur existant
router.put('/user/edit', async (req, res) => {
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
        res.status(200).json({ success: true, message: 'Utilisateur mis à jour.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur :', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

// Supprimer un utilisateur
router.delete('/user/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM utilisateur WHERE id_utilisateur = ?', [id]);
        res.status(200).json({ success: true, message: 'Utilisateur supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur :', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

module.exports = router;
