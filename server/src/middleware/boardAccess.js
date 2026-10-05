import Board from '../models/Board.js';

export async function boardAccess(req, res, next) {
  const board = await Board.findOne({ _id: req.params.boardId ?? req.params.id, 'members.user': req.user.sub });
  if (!board) return res.status(404).json({ message: 'Board not found.' });
  req.board = board;
  req.membership = board.members.find((member) => member.user.toString() === req.user.sub);
  return next();
}

export function requireEditor(req, res, next) {
  if (!['owner', 'editor'].includes(req.membership.role)) return res.status(403).json({ message: 'Editor access is required.' });
  return next();
}
