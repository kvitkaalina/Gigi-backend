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
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Reset Your Password</title>
          <style type="text/css">
            /* Базовые стили */
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #333333;
              background-color: #f4f4f4;
            }
            /* Контейнер */
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            /* Кнопка для почтовых клиентов, поддерживающих стили */
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #3a5e63;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
              font-weight: bold;
              mso-line-height-rule: exactly;
              line-height: 100%;
            }
            /* Футер */
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666666;
              text-align: center;
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
          <!-- Основной контейнер -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <!-- Контент письма -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #333333; margin: 0 0 20px;">Password Reset</h2>
                      <p style="margin: 0 0 20px;">You received this email because you requested a password reset for your GiGi account.</p>
                      <p style="margin: 0 0 20px;">To reset your password, click the button below:</p>
                      
                      <!-- Кнопка для Outlook -->
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#3a5e63">
                        <w:anchorlock/>
                        <center>
                          <span style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
                            Reset Password
                          </span>
                        </center>
                      </v:roundrect>
                      <![endif]-->

                      <!-- Кнопка для остальных клиентов -->
                      <!--[if !mso]><!-->
                      <table border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                        <tr>
                          <td align="center" style="border-radius: 4px;" bgcolor="#3a5e63">
                            <a href="${resetUrl}" 
                               target="_blank"
                               style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; border: 1px solid #3a5e63; display: inline-block; border-radius: 4px; font-weight: bold;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <!--<![endif]-->

                      <p style="margin: 20px 0 10px; color: #666666;">If you did not request a password reset, please ignore this email.</p>
                      <p style="margin: 0 0 20px; color: #666666;">This link is valid for 1 hour.</p>
                      
                      <div style="margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px;">
                        <p style="margin: 0; color: #666666; font-size: 12px;">
                          Best regards,<br/>
                          GiGi Team
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  }
}; 