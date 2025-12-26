import nodemailer from 'nodemailer';
import { query } from '../config/database.js';

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
  if (transporter) {
    return transporter;
  }

  // Only initialize if SMTP settings are configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('⚠️  Email notifications disabled (SMTP not configured)');
    return null;
  }

  try {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('✅ Email transporter initialized');
    return transporter;
  } catch (error) {
    console.error('❌ Error initializing email transporter:', error);
    return null;
  }
}

/**
 * Check if email notifications are enabled
 */
async function areNotificationsEnabled() {
  try {
    const result = await query(
      'SELECT notifications_enabled, notification_email FROM system_settings WHERE id = 1'
    );

    if (result.rows.length === 0) {
      return { enabled: false, email: null };
    }

    const settings = result.rows[0];
    return {
      enabled: settings.notifications_enabled && !!settings.notification_email,
      email: settings.notification_email,
    };
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return { enabled: false, email: null };
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

    // Initialize transporter if not already done
    const emailTransporter = initializeTransporter();

    if (!emailTransporter) {
      console.log('   ⚠️  Email transporter not available');
      return;
    }

    const recipientEmail = notificationSettings.email;

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
      from: process.env.SMTP_FROM || `"Status Monitor" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    await emailTransporter.sendMail(mailOptions);

    console.log(`   📧 Downtime alert sent to ${recipientEmail}`);
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

    const emailTransporter = initializeTransporter();

    if (!emailTransporter) {
      return;
    }

    const recipientEmail = notificationSettings.email;

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
      from: process.env.SMTP_FROM || `"Status Monitor" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    await emailTransporter.sendMail(mailOptions);

    console.log(`   📧 Recovery notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending recovery notification:', error);
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration() {
  try {
    const emailTransporter = initializeTransporter();

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
  sendDowntimeAlert,
  sendRecoveryNotification,
  testEmailConfiguration,
};
