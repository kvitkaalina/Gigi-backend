import dotenv from 'dotenv';
dotenv.config();

export const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

export const emailTemplates = {
  resetPassword: {
    subject: 'GiGi - Password Reset',
    generateHTML: (resetUrl) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #3a5e63;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset</h2>
            <p>You received this email because you requested a password reset for your GiGi account.</p>
            <p>To reset your password, click the button below:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>This link is valid for 1 hour.</p>
            <div class="footer">
              <p>Best regards,<br>GiGi Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}; 