require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: {
    rejectUnauthorized: false // Conectar de forma externa a render
  }
});






app.listen(PORT, () => {
  console.log(`Servidor corriendo localmente en http://localhost:${PORT}`);
});
