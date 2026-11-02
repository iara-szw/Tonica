import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/authRoutes.js';
import musicRoutes from './src/routes/musicaRoutes.js';
import bibliotecaRoutes from './src/routes/bibliotecaRoutes.js'
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/biblioteca', bibliotecaRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/musica/', musicRoutes);
app.listen(PORT, () => {
  console.log(`Servidor corriendo con ES Modules en http://localhost:${PORT}`);
});
