import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  position: { type: Number, required: true },
}, { _id: true });

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 300, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
  }],
  columns: { type: [columnSchema], default: [] },
}, { timestamps: true });

boardSchema.index({ 'members.user': 1 });
export default mongoose.model('Board', boardSchema);
