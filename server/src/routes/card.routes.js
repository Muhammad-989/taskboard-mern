import { Router } from 'express';
import { z } from 'zod';
import Card from '../models/Card.js';
import { authenticate } from '../middleware/auth.js';
import { boardAccess, requireEditor } from '../middleware/boardAccess.js';

const router = Router();
const cardInput = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(2000).optional(), priority: z.enum(['low', 'medium', 'high']).optional(), labels: z.array(z.string().trim()).max(5).optional(), columnId: z.string().min(1).optional(), position: z.number().finite().optional() });
router.use(authenticate);
router.post('/boards/:boardId/cards', boardAccess, requireEditor, async (req, res, next) => {
  try {
    const input = cardInput.parse(req.body);
    const columnId = input.columnId ?? req.board.columns[0]?._id;
    if (!columnId || !req.board.columns.some((column) => column._id.toString() === columnId)) return res.status(400).json({ message: 'Choose a valid column.' });
    const card = await Card.create({ ...input, board: req.board._id, columnId, position: input.position ?? 1000 });
    return res.status(201).json(card);
  } catch (error) { return next(error); }
});
router.patch('/:cardId', async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    req.params.boardId = card.board.toString();
    return boardAccess(req, res, async () => {
      if (!['owner', 'editor'].includes(req.membership.role)) return res.status(403).json({ message: 'Editor access is required.' });
      const input = cardInput.partial().parse(req.body);
      const updated = await Card.findByIdAndUpdate(card._id, input, { new: true, runValidators: true });
      return res.json(updated);
    });
  } catch (error) { return next(error); }
});
router.delete('/:cardId', async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    req.params.boardId = card.board.toString();
    return boardAccess(req, res, async () => {
      if (!['owner', 'editor'].includes(req.membership.role)) return res.status(403).json({ message: 'Editor access is required.' });
      await card.deleteOne();
      return res.status(204).end();
    });
  } catch (error) { return next(error); }
});
router.patch('/:cardId/move', async (req, res, next) => {
  try {
    const input = z.object({ columnId: z.string(), position: z.number().finite() }).parse(req.body);
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    req.params.boardId = card.board.toString();
    return boardAccess(req, res, async () => {
      if (!['owner', 'editor'].includes(req.membership.role)) return res.status(403).json({ message: 'Editor access is required.' });
      if (!req.board.columns.some((column) => column._id.toString() === input.columnId)) return res.status(400).json({ message: 'Choose a valid column.' });
      card.columnId = input.columnId; card.position = input.position; await card.save(); return res.json(card);
    });
  } catch (error) { return next(error); }
});
export default router;
