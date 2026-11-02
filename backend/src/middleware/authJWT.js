import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token válido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

export default authMiddleware;
