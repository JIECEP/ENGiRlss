import Project from '../models/Project.js';
import User from '../models/User.js';

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('createdBy', 'name email').sort({ name: 1 });
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Project name is required.' });
    }

    const existing = await Project.findOne({ 
      name: { $regex: new RegExp('^' + name.trim() + '$', 'i') } 
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A project with this name already exists.' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await project.deleteOne();

    // Cascade update: set project to null for any users associated with this project
    await User.updateMany({ project: req.params.id }, { project: null });

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
