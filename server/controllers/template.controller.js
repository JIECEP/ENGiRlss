import Template from '../models/Template.js';
import fs from 'fs';
import path from 'path';

export const uploadTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const { nameX, nameY, fontSize, fontFamily } = req.body;
    const template = await Template.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      nameX: nameX ? parseFloat(nameX) : 0.5,
      nameY: nameY ? parseFloat(nameY) : 0.5,
      fontSize: fontSize ? parseInt(fontSize) : 42,
      fontFamily: fontFamily || 'Helvetica-Bold',
      uploadedBy: req.user._id,
    });
    await template.populate('uploadedBy', 'name email');
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { uploadedBy: req.user._id };
    const templates = await Template.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    // Delete file from filesystem
    if (fs.existsSync(template.filepath)) {
      fs.unlinkSync(template.filepath);
    }
    await template.deleteOne();
    res.json({ success: true, message: 'Template deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
