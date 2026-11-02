require('dotenv').config(); // Carga las variables del archivo .env
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000; // Ahora usa la variable de entorno

app.use(cors());
app.use(express.json());
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Servidor Express con variables de entorno listo' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
