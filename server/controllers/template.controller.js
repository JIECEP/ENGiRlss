import Template from '../models/Template.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

export const uploadTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const { nameX, nameY, fontSize, fontFamily, codeX, codeY, codeFontSize, codeFontFamily } = req.body;
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
      codeX: codeX ? parseFloat(codeX) : 0.5,
      codeY: codeY ? parseFloat(codeY) : 0.8,
      codeFontSize: codeFontSize ? parseInt(codeFontSize) : 16,
      codeFontFamily: codeFontFamily || 'Helvetica',
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
    let filter = {};
    if (req.user.role !== 'admin') {
      if (req.user.project) {
        const userIds = await User.find({ project: req.user.project }).distinct('_id');
        filter = { uploadedBy: { $in: userIds } };
      } else {
        filter = { uploadedBy: req.user._id };
      }
    }
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

    if (req.user.role !== 'admin') {
      const creator = await User.findById(template.uploadedBy);
      const isOwner = template.uploadedBy.toString() === req.user._id.toString();
      const isSameProject = creator && req.user.project && creator.project && creator.project.toString() === req.user.project.toString();
      if (!isOwner && !isSameProject) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this template.' });
      }
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
