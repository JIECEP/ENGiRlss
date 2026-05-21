# CARMS - Certificate Automation & Repository Management System

CARMS is a robust, full-stack web application designed to streamline the batch generation and distribution of personalized certificates. 

## Features
- **Dynamic Template Configuration**: Upload custom background templates and visually drag-and-drop the participant name placement.
- **Batch Processing**: Upload CSV/Excel files containing participant lists.
- **Automated PDF Generation**: Automatically maps participant names onto templates and generates downloadable PDFs.
- **Email Distribution**: Automatically dispatches generated certificates to participants via email.
- **Role-Based Access**:
  - **Admins**: Manage supervisors and monitor all generated certificates and templates across the organization.
  - **Supervisors**: Create and manage their own templates and distribute certificates.

## Tech Stack
- **Frontend**: React (Vite), Vanilla CSS, Lucide Icons, react-hot-toast, xlsx.
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT.
- **Utilities**: `pdf-lib` for PDF generation, `nodemailer` for email dispatch, `multer` for file uploads.

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd CARMS
   ```

2. **Install dependencies:**
   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the `server` directory using the provided `server/.env.example` as a template. You will need a valid MongoDB URI and a Gmail App Password for sending emails.

4. **Seed the database (Optional):**
   ```bash
   cd server
   npm run seed
   ```
   *(This creates the default Admin and Supervisor accounts).*

5. **Start the application:**
   You will need two terminal windows:
   - **Backend**: `cd server && npm run dev`
   - **Frontend**: `cd client && npm run dev`

## Default Credentials
If you seeded the database:
- **Admin**: `admin@carms.com` / `admin123`
- **Supervisor**: `supervisor@carms.com` / `super123`
