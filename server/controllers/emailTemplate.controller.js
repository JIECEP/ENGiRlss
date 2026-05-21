import EmailTemplate from '../models/EmailTemplate.js';
import User from '../models/User.js';

// Get all email templates
export const getEmailTemplates = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      if (req.user.project) {
        const userIds = await User.find({ project: req.user.project }).distinct('_id');
        query.createdBy = { $in: userIds };
      } else {
        query.createdBy = req.user._id;
      }
    }
    let templates = await EmailTemplate.find(query).populate('createdBy', 'name');
    
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new template
export const createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    const template = await EmailTemplate.create({
      name,
      subject,
      body,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a template
export const updateEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    if (req.user.role !== 'admin') {
      const creator = await User.findById(template.createdBy);
      const isOwner = template.createdBy.toString() === req.user._id.toString();
      const isSameProject = creator && req.user.project && creator.project && creator.project.toString() === req.user.project.toString();
      if (!isOwner && !isSameProject) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify this template.' });
      }
    }

    template.name = name !== undefined ? name : template.name;
    template.subject = subject !== undefined ? subject : template.subject;
    template.body = body !== undefined ? body : template.body;
    await template.save();

    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a template
export const deleteEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    if (req.user.role !== 'admin') {
      const creator = await User.findById(template.createdBy);
      const isOwner = template.createdBy.toString() === req.user._id.toString();
      const isSameProject = creator && req.user.project && creator.project && creator.project.toString() === req.user.project.toString();
      if (!isOwner && !isSameProject) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this template.' });
      }
    }

    await template.deleteOne();
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
