import nodemailer from 'nodemailer';
import { emailConfig, emailTemplates } from '../config/email.js';

// Добавляем отладочную информацию
console.log('Email Config:', {
  service: emailConfig.service,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass ? '***' : 'not set'
  }
});

const transporter = nodemailer.createTransport(emailConfig);

export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    console.log('Sending email to:', email);
    console.log('Reset URL:', resetUrl);
    console.log('Using email credentials:', {
      from: process.env.EMAIL_USER,
      auth_user: emailConfig.auth.user
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailTemplates.resetPassword.subject,
      html: emailTemplates.resetPassword.generateHTML(resetUrl)
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}; 