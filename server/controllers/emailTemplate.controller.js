import EmailTemplate from '../models/EmailTemplate.js';

// Get all email templates
export const getEmailTemplates = async (req, res) => {
  try {
    let templates = await EmailTemplate.find({ createdBy: req.user._id });
    
    if (templates.length === 0) {
      // Create a default template if none exist
      const defaultTemplate = await EmailTemplate.create({
        name: 'Default Participation Template',
        subject: 'Your Certificate of Participation',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Certificate of Participation</h2>
            <p>Dear <strong>{{name}}</strong>,</p>
            <p>Congratulations! Please find attached your certificate.</p>
            <br/>
            <p>Best regards,<br/><strong>CARMS System</strong></p>
          </div>
        `,
        createdBy: req.user._id,
      });
      templates = [defaultTemplate];
    }
    
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
    const template = await EmailTemplate.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { name, subject, body },
      { new: true }
    );
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a template
export const deleteEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
