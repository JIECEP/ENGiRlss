import Certificate from '../models/Certificate.js';
import Template from '../models/Template.js';
import Event from '../models/Event.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate certificates from an array of participants
export const generateCertificates = async (req, res) => {
  try {
    const { templateId, participants, eventId } = req.body;
    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found.' });

    if (!participants || participants.length === 0) {
      return res.status(400).json({ success: false, message: 'No participants provided.' });
    }

    const templatePath = template.filepath;
    if (!fs.existsSync(templatePath)) {
      return res.status(400).json({ success: false, message: 'Template file not found on server.' });
    }

    const outputDir = path.join(__dirname, '../generated-certificates');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const generated = [];
    const errors = [];

    for (const participant of participants) {
      try {
        if (!participant.name || !participant.email) throw new Error('Missing name or email');

        // Check if certificate already exists
        let cert = eventId
          ? await Certificate.findOne({ participantEmail: participant.email, eventId })
          : await Certificate.findOne({ participantEmail: participant.email, templateId });

        // Generate PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 595]); // A4 landscape

        // Embed background image
        const imageBytes = fs.readFileSync(templatePath);
        let bgImage;
        const ext = path.extname(templatePath).toLowerCase();
        if (ext === '.png') {
          bgImage = await pdfDoc.embedPng(imageBytes);
        } else {
          bgImage = await pdfDoc.embedJpg(imageBytes);
        }

        const { width, height } = page.getSize();
        page.drawImage(bgImage, { x: 0, y: 0, width, height });

        const tmplFontStr = template.fontFamily || 'Helvetica-Bold';
        let selectedFont = StandardFonts.HelveticaBold;
        if (tmplFontStr === 'Times-Roman') selectedFont = StandardFonts.TimesRoman;
        else if (tmplFontStr === 'Times-Bold') selectedFont = StandardFonts.TimesRomanBold;
        else if (tmplFontStr === 'Helvetica') selectedFont = StandardFonts.Helvetica;
        else if (tmplFontStr === 'Courier') selectedFont = StandardFonts.Courier;
        else if (tmplFontStr === 'Courier-Bold') selectedFont = StandardFonts.CourierBold;

        const font = await pdfDoc.embedFont(selectedFont);
        const nameText = participant.name;
        const nameFontSize = template.fontSize || 42;
        const nameWidth = font.widthOfTextAtSize(nameText, nameFontSize);

        const nameX = template.nameX ?? 0.5;
        const nameY = template.nameY ?? 0.5;
        const xPos = (width * nameX) - (nameWidth / 2);
        const yPos = height - (height * nameY) - (nameFontSize / 3);

        page.drawText(nameText, {
          x: xPos,
          y: yPos,
          size: nameFontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });

        const pdfBytes = await pdfDoc.save();
        const safeFileName = participant.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const filename = `${safeFileName}_Certificate_${Date.now()}.pdf`;
        const outputPath = path.join(outputDir, filename);
        fs.writeFileSync(outputPath, pdfBytes);

        if (cert) {
          cert.filename = filename;
          cert.pdfPath = outputPath;
          cert.emailSent = false;
          cert.participantName = participant.name;
          await cert.save();
        } else {
          cert = await Certificate.create({
            templateId,
            eventId: eventId || null,
            participantName: participant.name,
            participantEmail: participant.email,
            filename,
            pdfPath: outputPath,
          });
        }
        generated.push({ id: cert._id, name: cert.participantName, email: cert.participantEmail, filename });
      } catch (err) {
        console.error('Certificate Generation Error for', participant.name, ':', err);
        errors.push({ name: participant.name, error: err.message });
      }
    }

    // Update event status if eventId provided
    if (eventId && generated.length > 0) {
      await Event.findByIdAndUpdate(eventId, { status: 'generated', recipientCount: generated.length });
    }

    res.json({
      success: true,
      message: `Generated ${generated.length} certificate(s).`,
      generated,
      errors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send certificates via email
export const sendEmails = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No certificate IDs provided.' });
    }

    const certificates = await Certificate.find({ _id: { $in: certificateIds } }).populate('templateId');
    if (certificates.length === 0) {
      return res.status(400).json({ success: false, message: 'Certificates not found.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const sent = [];
    const failed = [];

    for (const cert of certificates) {
      if (!fs.existsSync(cert.pdfPath)) {
        failed.push({ certId: cert._id, error: 'Missing PDF file.' });
        continue;
      }

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: cert.participantEmail,
          subject: `Your Certificate of Participation`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">Certificate of Participation</h2>
              <p>Dear <strong>${cert.participantName}</strong>,</p>
              <p>Congratulations! Please find attached your certificate.</p>
              <br/>
              <p>Best regards,<br/><strong>CARMS System</strong></p>
            </div>
          `,
          attachments: [{
            filename: cert.filename,
            path: cert.pdfPath,
          }],
        });

        cert.emailSent = true;
        cert.emailSentAt = new Date();
        await cert.save();
        sent.push({ certId: cert._id, name: cert.participantName, email: cert.participantEmail });
      } catch (err) {
        failed.push({ certId: cert._id, name: cert.participantName, error: err.message });
      }
    }

    // Update event status if all certificates belong to an event
    if (sent.length > 0) {
      const sentCerts = await Certificate.find({ _id: { $in: sent.map(s => s.certId) } });
      const eventIds = [...new Set(sentCerts.filter(c => c.eventId).map(c => c.eventId.toString()))];
      for (const eid of eventIds) {
        const pending = await Certificate.countDocuments({ eventId: eid, emailSent: false });
        if (pending === 0) {
          await Event.findByIdAndUpdate(eid, { status: 'sent' });
        }
      }
    }

    res.json({
      success: true,
      message: `Sent ${sent.length} email(s). ${failed.length} failed.`,
      sent,
      failed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all certificates
export const getCertificates = async (req, res) => {
  try {
    const { templateId, eventId, search } = req.query;
    let filter = {};
    if (templateId) filter.templateId = templateId;
    if (eventId) filter.eventId = eventId;

    let certs = await Certificate.find(filter)
      .populate({ path: 'templateId', select: 'originalName filename' })
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      certs = certs.filter(c =>
        c.participantName?.toLowerCase().includes(s) ||
        c.participantEmail?.toLowerCase().includes(s) ||
        c.templateId?.originalName?.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, certificates: certs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download a certificate
export const downloadCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    if (!fs.existsSync(cert.pdfPath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on server.' });
    }
    res.download(cert.pdfPath, cert.filename);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dashboard stats
export const getStats = async (req, res) => {
  try {
    const [totalCerts, sentCerts, pendingCerts] = await Promise.all([
      Certificate.countDocuments(),
      Certificate.countDocuments({ emailSent: true }),
      Certificate.countDocuments({ emailSent: false }),
    ]);
    res.json({ success: true, stats: { totalCerts, sentCerts, pendingCerts } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
