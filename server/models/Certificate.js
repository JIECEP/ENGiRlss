import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
  participantName: { type: String, required: true },
  participantEmail: { type: String, required: true },
  code: { type: String, unique: true, sparse: true },
  filename: { type: String, required: true },
  pdfPath: { type: String, required: true },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Certificate', certificateSchema);
