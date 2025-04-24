const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

// A utiliser qu'après la fonction/middleware -> verifyToken
const isAdmin = async (req, res, next) => {
  console.log(req.user);
  if (req.user) {
    // ...
  }
};

// ➤ Vérifier si un user est admin
router.post('/useadmin', async (req, res) => {
  console.log("je passe ii");
  console.log(req.body);
  try {
    const { email, password } = req.body;
    const [useadmin] = await pool.query(
      'SELECT * FROM utilisateur WHERE email = ? AND admin = ?',
      [email, 1]
    );
    if (useadmin.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé ou non admin.' });
    }
    const passwordMatch = await bcrypt.compare(password, useadmin[0].motdepasse);
    console.log(passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    // Succès
    res.status(200).json({ success: true, mail: useadmin[0].email });
  } catch (error) {
    console.error('Error durant le login:', error);
    res.status(500).json({ error: 'erreur' });
  }
});

// ➤ Login admin ?
router.post('/login', async (req, res) => {
  try {
    const { email, motdepasse } = req.body;
    const [user] = await pool.query(
      'SELECT * FROM utilisateur WHERE email = ? AND admin = ?',
      [email, 1]
    );
    if (user.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé ou non admin.' });
    }
    const passwordMatch = await bcrypt.compare(motdepasse, user[0].motdepasse);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    const token = jwt.sign({ id: user[0].id_utilisateur }, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });
    res.status(200).json({ success: true, token: token });
  } catch (error) {
    console.error('Error durant le login:', error);
    res.status(500).json({ error: 'erreur' });
  }
});

// ➤ Inscription pour Flutter : /register_mobile
router.post('/register_mobile', async (req, res) => {
  try {
    const {
      email,
      motdepasse,
      admin,     // 0 ou 1
      nom,
      prenom,
      adresse,
      ville,
      code_postal
    } = req.body;

    // Vérifier si l'email existe déjà
    const [user] = await pool.query(
      'SELECT * FROM utilisateur WHERE email = ?',
      [email]
    );
    if (user.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motdepasse, 10);

    // Insérer dans la table utilisateur
    // admin par défaut = 0 si tu veux
    const [result] = await pool.query(
      `INSERT INTO utilisateur 
        (email, motdepasse, admin, nom, prenom, adresse, ville, code_postal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        hashedPassword,
        admin || 0,  // si admin n'est pas fourni, on met 0
        nom,
        prenom,
        adresse,
        ville,
        code_postal
      ]
    );

    // Réponse au client
    return res.status(200).json({
      success: true,
      message: 'Inscription réussie (mobile).'
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription (mobile):", error);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

// ➤ Supprimer un utilisateur
router.delete('/delete', async (req, res) => {
  try {
    const { email } = req.query;
    const [result] = await pool.query(
      'DELETE FROM utilisateur WHERE email = ?',
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

module.exports = router;