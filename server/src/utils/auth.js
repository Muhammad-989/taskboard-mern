import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET ?? 'development-secret-change-me';
export const signAccessToken = (user) => jwt.sign({ sub: user._id.toString(), name: user.name, email: user.email }, secret(), { expiresIn: '15m' });
export const signRefreshToken = (user) => jwt.sign({ sub: user._id.toString() }, secret(), { expiresIn: '7d' });
export const verifyToken = (token) => jwt.verify(token, secret());
