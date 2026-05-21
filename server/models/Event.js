import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  date: { type: Date, required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null },
  emailTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'generated', 'sent'], default: 'draft' },
  recipientCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

eventSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Event', eventSchema);
