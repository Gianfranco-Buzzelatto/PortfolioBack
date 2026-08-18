import jwt from 'jsonwebtoken';

export function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'secret' || secret.length < 32) {
    throw new Error('JWT_SECRET debe estar definido en .env (mínimo 32 caracteres).');
  }
  return secret;
}

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  try {
    req.user = jwt.verify(token, requireJwtSecret());
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
};
