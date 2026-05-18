import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  filepath: { type: String, required: true },
  mimetype: { type: String },
  size: { type: Number },
  nameX: { type: Number, default: 0.5 },
  nameY: { type: Number, default: 0.5 },
  fontSize: { type: Number, default: 42 },
  fontFamily: { type: String, default: 'Helvetica-Bold' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Template', templateSchema);
