const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const router = express.Router();

router.post('/useadmin', async (req, res) => {
  console.log("je passe ii");
  console.log(req.body);
  try {
    const { email, password } = req.body;
    const [useadmin] = await pool.query('SELECT * FROM utilisateur where email = ? AND admin = ?', [email, 1]);
    if (useadmin.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }
    const passwordMatch = await bcrypt.compare(password, useadmin[0].motdepasse);
    console.log(passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    res.status(200).json({ success: true, mail: useadmin[0].email });
  } catch (error) {
    console.error('Error durant le login:', error);
    res.status(500).json({ error: 'erreur' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, motdepasse } = req.body;
    const [user] = await pool.query('SELECT * FROM utilisateur WHERE email = ? AND admin = ?', [email, 1]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }
    const passwordMatch = await bcrypt.compare(motdepasse, user[0].motdepasse);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    res.status(200).json({ success: true, mail: user[0].email, nom: user[0].nom });
  } catch (error) {
    console.error('Error durant le login:', error);
    res.status(500).json({ error: 'erreur' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, motdepasse, admin } = req.body;
    const [user] = await pool.query('SELECT * FROM utilisateur WHERE email = ?', [email]);
    if (user.length > 0) {
      return res.status(404).json({ error: 'Email déjà utilisé.' });
    }
    const password = await bcrypt.hash(motdepasse, 10);
    await pool.query('INSERT INTO utilisateur(email, motdepasse, admin) VALUES (?,?,?)', [email, password, admin]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

router.delete('/delete', async (req, res) => {
  try {
    const { email } = req.query;
    const [result] = await pool.query('DELETE FROM utilisateur WHERE email = ?', [email]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

module.exports = router;
