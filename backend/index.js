require('dotenv').config(); // Carga las variables del archivo .env
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000; // Ahora usa la variable de entorno

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Servidor Express con variables de entorno listo' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
