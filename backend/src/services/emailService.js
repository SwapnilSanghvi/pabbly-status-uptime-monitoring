import { createTransport } from 'nodemailer';
import { query } from '../config/database.js';

/**
 * Get SMTP settings from database
 */
async function getSMTPSettings() {
  try {
    const result = await query(
      'SELECT smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from FROM system_settings WHERE id = 1'
    );

    if (result.rows.length === 0) {
      return null;
    }

    const settings = result.rows[0];

    // Only return settings if host and user are configured
    if (!settings.smtp_host || !settings.smtp_user) {
      return null;
    }

    return settings;
  } catch (error) {
    console.error('Error fetching SMTP settings from database:', error);
    return null;
  }
}

/**
 * Initialize email transporter with database settings
 */
async function initializeTransporter() {
  try {
    const smtpSettings = await getSMTPSettings();

    if (!smtpSettings) {
      console.log('⚠️  Email notifications disabled (SMTP not configured)');
      return null;
    }

    const transporter = createTransport({
      host: smtpSettings.smtp_host,
      port: parseInt(smtpSettings.smtp_port) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpSettings.smtp_user,
        pass: smtpSettings.smtp_pass,
      },
    });

    console.log('✅ Email transporter initialized from database settings');
    return transporter;
  } catch (error) {
    console.error('❌ Error initializing email transporter:', error);
    return null;
  }
}

/**
 * Check if email notifications are enabled (based on SMTP configuration)
 */
async function areNotificationsEnabled() {
  try {
    const result = await query(
      'SELECT smtp_host, smtp_port, smtp_user, smtp_recipients, notification_email FROM system_settings WHERE id = 1'
    );

    if (result.rows.length === 0) {
      return { enabled: false, emails: [] };
    }

    const settings = result.rows[0];

    // Check if SMTP is configured (host, port, user must be present)
    const smtpConfigured = settings.smtp_host && settings.smtp_port && settings.smtp_user;

    if (!smtpConfigured) {
      return { enabled: false, emails: [] };
    }

    // Get recipient emails
    let recipientEmails = [];
    if (settings.smtp_recipients && settings.smtp_recipients.trim()) {
      // Split by comma and trim whitespace
      recipientEmails = settings.smtp_recipients.split(',').map(email => email.trim()).filter(email => email);
    } else if (settings.notification_email && settings.notification_email.trim()) {
      // Fallback to old notification_email field
      recipientEmails = [settings.notification_email.trim()];
    }

    // Enabled only if SMTP is configured AND there are recipients
    return {
      enabled: recipientEmails.length > 0,
      emails: recipientEmails,
    };
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return { enabled: false, emails: [] };
  }
}

/**
 * Send downtime alert email
 */
export async function sendDowntimeAlert(api, incident) {
  try {
    // Check if notifications are enabled
    const notificationSettings = await areNotificationsEnabled();

    if (!notificationSettings.enabled) {
      console.log('   📧 Email notifications disabled');
      return;
    }

    // Initialize transporter with database settings
    const emailTransporter = await initializeTransporter();

    if (!emailTransporter) {
      console.log('   ⚠️  Email transporter not available');
      return;
    }

    // Get SMTP settings for 'from' address
    const smtpSettings = await getSMTPSettings();

    const recipientEmails = notificationSettings.emails.join(', ');

    // Email content
    const subject = `🔴 ALERT: ${api.name} is DOWN`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .detail { margin: 10px 0; }
            .label { font-weight: bold; color: #4b5563; }
            .value { color: #1f2937; }
            .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔴 API Downtime Alert</h1>
            </div>
            <div class="content">
              <p>An API endpoint you're monitoring has gone down:</p>

              <div class="detail">
                <span class="label">API Name:</span>
                <span class="value">${api.name}</span>
              </div>

              <div class="detail">
                <span class="label">URL:</span>
                <span class="value">${api.url}</span>
              </div>

              <div class="detail">
                <span class="label">Incident ID:</span>
                <span class="value">#${incident.id}</span>
              </div>

              <div class="detail">
                <span class="label">Started At:</span>
                <span class="value">${new Date(incident.started_at).toLocaleString()}</span>
              </div>

              <div class="detail">
                <span class="label">Status:</span>
                <span class="value">${incident.status}</span>
              </div>

              <p style="margin-top: 20px;">
                <strong>Action Required:</strong> Please investigate the issue.
                The system will continue to monitor and will notify you when the service recovers.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated alert from Status Monitor</p>
              <p>Timestamp: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
API Downtime Alert

An API endpoint you're monitoring has gone down:

API Name: ${api.name}
URL: ${api.url}
Incident ID: #${incident.id}
Started At: ${new Date(incident.started_at).toLocaleString()}
Status: ${incident.status}

Action Required: Please investigate the issue.
The system will continue to monitor and will notify you when the service recovers.

---
This is an automated alert from Status Monitor
Timestamp: ${new Date().toLocaleString()}
    `;

    // Send email
    const mailOptions = {
      from: smtpSettings.smtp_from || `"Status Monitor" <${smtpSettings.smtp_user}>`,
      bcc: recipientEmails,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    await emailTransporter.sendMail(mailOptions);

    console.log(`   📧 Downtime alert sent to ${recipientEmails}`);
  } catch (error) {
    console.error('Error sending downtime alert email:', error);
  }
}

/**
 * Send recovery notification email
 */
export async function sendRecoveryNotification(api, incident, downtimeMinutes) {
  try {
    const notificationSettings = await areNotificationsEnabled();

    if (!notificationSettings.enabled) {
      return;
    }

    const emailTransporter = await initializeTransporter();

    if (!emailTransporter) {
      return;
    }

    // Get SMTP settings for 'from' address
    const smtpSettings = await getSMTPSettings();

    const recipientEmails = notificationSettings.emails.join(', ');

    const subject = `🟢 RESOLVED: ${api.name} is back online`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .detail { margin: 10px 0; }
            .label { font-weight: bold; color: #4b5563; }
            .value { color: #1f2937; }
            .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🟢 API Recovery Notice</h1>
            </div>
            <div class="content">
              <p>Good news! The API endpoint has recovered:</p>

              <div class="detail">
                <span class="label">API Name:</span>
                <span class="value">${api.name}</span>
              </div>

              <div class="detail">
                <span class="label">URL:</span>
                <span class="value">${api.url}</span>
              </div>

              <div class="detail">
                <span class="label">Incident ID:</span>
                <span class="value">#${incident.id}</span>
              </div>

              <div class="detail">
                <span class="label">Downtime Duration:</span>
                <span class="value">${downtimeMinutes} minute(s)</span>
              </div>

              <div class="detail">
                <span class="label">Resolved At:</span>
                <span class="value">${new Date().toLocaleString()}</span>
              </div>

              <p style="margin-top: 20px;">
                The service is now responding normally. The incident has been automatically resolved.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from Status Monitor</p>
              <p>Timestamp: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: smtpSettings.smtp_from || `"Status Monitor" <${smtpSettings.smtp_user}>`,
      bcc: recipientEmails,
      subject: subject,
      html: htmlContent,
    };

    await emailTransporter.sendMail(mailOptions);

    console.log(`   📧 Recovery notification sent to ${recipientEmails}`);
  } catch (error) {
    console.error('Error sending recovery notification:', error);
  }
}

/**
 * Send a generic email
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    const emailTransporter = await initializeTransporter();

    if (!emailTransporter) {
      return {
        success: false,
        error: 'Email transporter not configured. Please check your SMTP settings in the Admin Settings.',
      };
    }

    // Get SMTP settings for 'from' address
    const smtpSettings = await getSMTPSettings();

    // Verify SMTP connection first
    try {
      await emailTransporter.verify();
    } catch (verifyError) {
      return {
        success: false,
        error: `SMTP connection failed: ${verifyError.message}`,
      };
    }

    // Send email
    const mailOptions = {
      from: smtpSettings.smtp_from || `"Status Monitor" <${smtpSettings.smtp_user}>`,
      bcc: to,
      subject: subject,
      text: text,
      html: html,
    };

    await emailTransporter.sendMail(mailOptions);

    return {
      success: true,
      message: `Email sent successfully to ${to}`,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration() {
  try {
    const emailTransporter = await initializeTransporter();

    if (!emailTransporter) {
      return {
        success: false,
        message: 'Email transporter not configured',
      };
    }

    const notificationSettings = await areNotificationsEnabled();

    if (!notificationSettings.enabled) {
      return {
        success: false,
        message: 'Email notifications are disabled in settings',
      };
    }

    // Verify SMTP connection
    await emailTransporter.verify();

    return {
      success: true,
      message: 'Email configuration is valid',
      recipient: notificationSettings.email,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

export default {
  sendEmail,
  sendDowntimeAlert,
  sendRecoveryNotification,
  testEmailConfiguration,
};
