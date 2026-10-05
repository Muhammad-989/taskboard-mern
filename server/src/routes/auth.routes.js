import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const credentials = z.object({ name: z.string().trim().min(2).max(80).optional(), email: z.string().email(), password: z.string().min(8).max(100) });
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function respond(user, res) {
  res.cookie('refreshToken', signRefreshToken(user), cookieOptions);
  return res.json({ user: { id: user._id, name: user.name, email: user.email }, accessToken: signAccessToken(user) });
}

router.post('/register', async (req, res, next) => {
  try {
    const input = credentials.extend({ name: z.string().trim().min(2).max(80) }).parse(req.body);
    const exists = await User.findOne({ email: input.email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await User.create({ ...input, email: input.email.toLowerCase(), passwordHash: await bcrypt.hash(input.password, 12) });
    return respond(user, res);
  } catch (error) { return next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = credentials.omit({ name: true }).parse(req.body);
    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    return respond(user, res);
  } catch (error) { return next(error); }
});

router.post('/refresh', async (req, res) => {
  try {
    const payload = verifyToken(req.cookies.refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) throw new Error('Missing user');
    return res.json({ accessToken: signAccessToken(user) });
  } catch { return res.status(401).json({ message: 'Refresh token is invalid.' }); }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user.sub).select('_id name email');
  if (!user) return res.status(401).json({ message: 'User not found.' });
  return res.json({ user: { id: user._id, name: user.name, email: user.email } });
});

router.post('/logout', (_req, res) => res.clearCookie('refreshToken').json({ message: 'Logged out.' }));
export default router;
