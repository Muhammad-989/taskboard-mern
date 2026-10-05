import { Router } from 'express';
import { z } from 'zod';
import Board from '../models/Board.js';
import Card from '../models/Card.js';
import { authenticate } from '../middleware/auth.js';
import { boardAccess, requireEditor } from '../middleware/boardAccess.js';

const router = Router();
const boardInput = z.object({ title: z.string().trim().min(1).max(100), description: z.string().trim().max(300).optional() });

router.use(authenticate);
router.get('/', async (req, res, next) => {
  try {
    const boards = await Board.find({ 'members.user': req.user.sub }).sort({ updatedAt: -1 }).lean();
    return res.json(boards);
  } catch (error) { return next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    const input = boardInput.parse(req.body);
    const board = await Board.create({ ...input, owner: req.user.sub, members: [{ user: req.user.sub, role: 'owner' }], columns: [{ title: 'To do', position: 1000 }, { title: 'In progress', position: 2000 }, { title: 'Done', position: 3000 }] });
    return res.status(201).json(board);
  } catch (error) { return next(error); }
});
router.get('/:id', boardAccess, async (req, res, next) => {
  try {
    const cards = await Card.find({ board: req.board._id }).sort({ position: 1 }).lean();
    return res.json({ board: req.board, cards });
  } catch (error) { return next(error); }
});
router.patch('/:id', boardAccess, requireEditor, async (req, res, next) => {
  try {
    const input = boardInput.partial().parse(req.body);
    const board = await Board.findByIdAndUpdate(req.board._id, input, { new: true, runValidators: true });
    return res.json(board);
  } catch (error) { return next(error); }
});
router.delete('/:id', boardAccess, (req, res, next) => {
  if (req.membership.role !== 'owner') return res.status(403).json({ message: 'Only the owner can delete a board.' });
  return Promise.all([Board.deleteOne({ _id: req.board._id }), Card.deleteMany({ board: req.board._id })]).then(() => res.status(204).end()).catch(next);
});
export default router;
