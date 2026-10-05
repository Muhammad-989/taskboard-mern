import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  columnId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  position: { type: Number, default: 1000 },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  labels: [{ type: String, trim: true }],
}, { timestamps: true });

cardSchema.index({ board: 1, columnId: 1, position: 1 });
export default mongoose.model('Card', cardSchema);
