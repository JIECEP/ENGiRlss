import Event from '../models/Event.js';
import Certificate from '../models/Certificate.js';
import fs from 'fs';

export const createEvent = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Title and date are required.' });
    }
    const event = await Event.create({
      title,
      description: description || '',
      date,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    const events = await Event.find(filter)
      .populate('templateId', 'originalName filename')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Attach certificate counts for each event
    const eventsWithCounts = await Promise.all(events.map(async (event) => {
      const eventObj = event.toObject();
      const [totalCerts, sentCerts] = await Promise.all([
        Certificate.countDocuments({ eventId: event._id }),
        Certificate.countDocuments({ eventId: event._id, emailSent: true }),
      ]);
      eventObj.totalCerts = totalCerts;
      eventObj.sentCerts = sentCerts;
      return eventObj;
    }));

    res.json({ success: true, events: eventsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('templateId')
      .populate('createdBy', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const [totalCerts, sentCerts] = await Promise.all([
      Certificate.countDocuments({ eventId: event._id }),
      Certificate.countDocuments({ eventId: event._id, emailSent: true }),
    ]);

    const eventObj = event.toObject();
    eventObj.totalCerts = totalCerts;
    eventObj.sentCerts = sentCerts;

    res.json({ success: true, event: eventObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { title, description, date, templateId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (templateId !== undefined) event.templateId = templateId;

    await event.save();
    await event.populate('templateId');
    await event.populate('createdBy', 'name email');
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    // Delete associated certificates and their PDF files
    const certs = await Certificate.find({ eventId: event._id });
    for (const cert of certs) {
      if (cert.pdfPath && fs.existsSync(cert.pdfPath)) {
        fs.unlinkSync(cert.pdfPath);
      }
    }
    await Certificate.deleteMany({ eventId: event._id });
    await event.deleteOne();

    res.json({ success: true, message: 'Event and associated certificates deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
