const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',          // 🔁 Adresse IP de ta machine MySQL (remplace localhost)
    user: 'root',               // 👤 Nom d'utilisateur MySQL
    database: 'bts_projet',     // 📂 Nom de la base
    password: '' // 🔑 Mot de passe MySQL
});


pool.getConnection((err, connection) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        return;
    }
    console.log('Connecté à la base de données.');
    connection.release();
});

module.exports = { pool };
