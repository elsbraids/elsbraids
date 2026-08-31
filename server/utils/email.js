const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Set API key if available
if (process.env.BREVO_API_KEY) {
  apiKey.apiKey = process.env.BREVO_API_KEY;
}

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Generic helper to send a transactional email via Brevo
 */
const sendEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn(`[Brevo Email] BREVO_API_KEY is not defined. Email skipped: "${subject}" to <${toEmail}>`);
    return false;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@elsbraids.com';
  const senderName = process.env.BREVO_SENDER_NAME || "El's Braids";

  const emailPayload = new SibApiV3Sdk.SendSmtpEmail();
  emailPayload.sender = { email: senderEmail, name: senderName };
  emailPayload.to = [{ email: toEmail, name: toName || toEmail }];
  emailPayload.subject = subject;
  emailPayload.htmlContent = htmlContent;

  try {
    const data = await apiInstance.sendTransacEmail(emailPayload);
    console.log(`[Brevo Email] Sent successfully to ${toEmail}. Message ID: ${data.messageId || 'N/A'}`);
    return true;
  } catch (error) {
    console.error(`[Brevo Email] Error sending to ${toEmail}:`, error.response?.body || error.message);
    return false;
  }
};

/**
 * Core Brand HTML Email Layout Wrapper
 */
const emailLayout = (title, contentHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9efef;font-family:'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f9efef;padding:30px 10px;">
    <tr>
      <td align="center">
        <!-- Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(91,43,69,0.05);border:1px solid #ead4dd;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #5b2b45, #7a3855);padding:32px 24px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">EL'S BRAIDS</h1>
              <p style="color:#f7dfe8;margin:6px 0 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Exquisite Braiding & Hair Care</p>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding:32px 24px;color:#2b1d22;line-height:1.6;">
              <h2 style="color:#5b2b45;font-size:18px;font-weight:700;margin-top:0;margin-bottom:20px;border-bottom:2px solid #f3dbe7;padding-bottom:10px;">${title}</h2>
              ${contentHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#fff8fb;padding:24px;text-align:center;border-top:1px solid #f3dbe7;font-size:12px;color:#7a3855;">
              <p style="margin:0 0 6px 0;font-weight:600;font-size:13px;color:#5b2b45;">El's Braids</p>
              <p style="margin:0 0 16px 0;color:#5f4253;">Atonsu, Kumasi, Ghana | Call: +233 20 000 0000</p>
              <p style="margin:0;color:#c98fa7;font-size:10px;">&copy; ${new Date().getFullYear()} El's Braids. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * 1. Send OTP for password reset
 */
const sendOtpEmail = async (email, otp) => {
  const htmlContent = emailLayout("Password Reset Verification", `
    <p>Hello,</p>
    <p>We received a request to reset the password for your El's Braids account. Please use the verification code below to complete the reset process:</p>
    <div style="text-align:center;margin:32px 0;">
      <span style="font-size:32px;font-weight:700;color:#5b2b45;background-color:#fff0f5;border:2px dashed #7a3855;border-radius:8px;padding:12px 28px;letter-spacing:6px;display:inline-block;">${otp}</span>
    </div>
    <p style="color:#7a3855;font-size:13px;font-weight:600;margin-bottom:0;">Security Reminder:</p>
    <p style="color:#5f4253;font-size:13px;margin-top:4px;">This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this message and ensure your account has a strong password.</p>
  `);

  return sendEmail({
    toEmail: email,
    subject: "EL'S BRAIDS — Your Password Reset Code",
    htmlContent
  });
};

/**
 * 2. Send Reset Confirmation Email
 */
const sendResetConfirmationEmail = async (email) => {
  const htmlContent = emailLayout("Password Changed Successfully", `
    <p>Hello,</p>
    <p>Your El's Braids account password has been changed successfully.</p>
    <div style="background-color:#fff5f5;border:1px solid #f8d7da;border-radius:8px;padding:16px;margin:24px 0;color:#842029;font-size:13px;line-height:1.5;">
      <strong>Security Alert:</strong> If you did not perform this action, please contact our support team immediately to secure your account.
    </div>
  `);

  return sendEmail({
    toEmail: email,
    subject: "EL'S BRAIDS — Password Changed Successfully",
    htmlContent
  });
};

/**
 * 3. Send Booking Confirmation (Customer)
 */
const sendBookingConfirmation = async (customer, bookingDetails) => {
  const name = customer.fullName || customer.name || 'Valued Customer';
  const email = customer.email || bookingDetails.email;

  const htmlContent = emailLayout("Booking Confirmed!", `
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your booking with El's Braids has been successfully confirmed! Here are the details of your appointment:</p>
    
    <div style="background-color:#fffafc;border:1px solid #ead4dd;border-radius:12px;padding:20px;margin:24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14px;color:#2b1d22;">
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;width:130px;">Reference:</td>
          <td style="padding:6px 0;font-weight:700;color:#5b2b45;">${bookingDetails.reference}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Service Name:</td>
          <td style="padding:6px 0;">${bookingDetails.serviceName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Date:</td>
          <td style="padding:6px 0;">${bookingDetails.date}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Time Slot:</td>
          <td style="padding:6px 0;">${bookingDetails.time}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Location:</td>
          <td style="padding:6px 0;">${bookingDetails.location || 'Atonsu, Kumasi, Ghana'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Payment Status:</td>
          <td style="padding:6px 0;color:#0f5132;font-weight:700;">${bookingDetails.paymentStatus || 'Paid'}</td>
        </tr>
      </table>
    </div>
    
    <p>Please plan to arrive approximately 10 minutes early. If you need to make changes, please contact us at least 24 hours prior to your scheduled time.</p>
    
    <div style="text-align:center;margin-top:28px;">
      <a href="https://elsbraids.com/account/orders" style="background-color:#5b2b45;color:#ffffff;text-decoration:none;padding:12px 24px;font-weight:bold;border-radius:8px;display:inline-block;box-shadow:0 2px 6px rgba(91,43,69,0.15);">Manage My Bookings</a>
    </div>
  `);

  return sendEmail({
    toEmail: email,
    toName: name,
    subject: "EL'S BRAIDS — Booking Confirmed!",
    htmlContent
  });
};

/**
 * 4. Send Booking Alert (Admin)
 */
const sendAdminBookingAlert = async (admin, bookingDetails, customerDetails) => {
  const adminEmail = typeof admin === 'string' ? admin : admin.email;
  const customerName = customerDetails.fullName || customerDetails.name || 'Valued Customer';

  const htmlContent = emailLayout("New Appointment Booking", `
    <p>Hello Admin,</p>
    <p>A new appointment booking has been scheduled on the platform. Review the details below:</p>
    
    <div style="background-color:#fffafc;border:1px solid #ead4dd;border-radius:12px;padding:20px;margin:24px 0;">
      <h3 style="margin-top:0;color:#5b2b45;font-size:15px;border-bottom:1px solid #f3dbe7;padding-bottom:6px;">Customer Information</h3>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;color:#2b1d22;margin-bottom:16px;">
        <tr>
          <td style="padding:4px 0;color:#7a3855;font-weight:600;width:120px;">Name:</td>
          <td style="padding:4px 0;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#7a3855;font-weight:600;">Email:</td>
          <td style="padding:4px 0;">${customerDetails.email}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#7a3855;font-weight:600;">Phone:</td>
          <td style="padding:4px 0;">${customerDetails.phone || bookingDetails.phone}</td>
        </tr>
      </table>
      
      <h3 style="margin-top:0;color:#5b2b45;font-size:15px;border-bottom:1px solid #f3dbe7;padding-bottom:6px;">Appointment Details</h3>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;color:#2b1d22;">
        <tr>
          <td style="padding:4px 0;color:#7a3855;font-weight:600;width:120px;">Reference:</td>
          <td style="padding:4px 0;font-weight:700;">${bookingDetails.reference}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#7a3855;font-weight:600;">Service:</td>
          <td style="padding:4px 0;">${bookingDetails.serviceName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#7a3855;font-weight:600;">Schedule:</td>
          <td style="padding:4px 0;">${bookingDetails.date} at ${bookingDetails.time}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#7a3855;font-weight:600;">Payment Option:</td>
          <td style="padding:4px 0;text-transform:capitalize;">${bookingDetails.paymentOption || 'Full'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#7a3855;font-weight:600;">Amount Paid:</td>
          <td style="padding:4px 0;font-weight:600;color:#0f5132;">GHS ${Number(bookingDetails.paymentAmount || 0).toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align:center;margin-top:28px;">
      <a href="https://elsbraids.com/admin" style="background-color:#5b2b45;color:#ffffff;text-decoration:none;padding:12px 24px;font-weight:bold;border-radius:8px;display:inline-block;">Open Admin Panel</a>
    </div>
  `);

  return sendEmail({
    toEmail: adminEmail,
    subject: `New Booking: ${bookingDetails.reference} - ${customerName}`,
    htmlContent
  });
};

/**
 * 5. Send Payment Receipt (Customer)
 */
const sendPaymentReceipt = async (customer, paymentDetails) => {
  const name = customer.fullName || customer.name || 'Valued Customer';
  const email = customer.email || paymentDetails.email;

  const htmlContent = emailLayout("Payment Receipt", `
    <p>Hello <strong>${name}</strong>,</p>
    <p>We've successfully processed your payment. Here are the transaction and receipt details:</p>
    
    <div style="background-color:#fffafc;border:1px solid #ead4dd;border-radius:12px;padding:20px;margin:24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14px;color:#2b1d22;">
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;width:150px;">Payment Reference:</td>
          <td style="padding:6px 0;font-weight:700;color:#5b2b45;">${paymentDetails.paymentReference || paymentDetails.reference}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Amount Paid:</td>
          <td style="padding:6px 0;font-weight:700;color:#0f5132;font-size:16px;">GHS ${Number(paymentDetails.total || paymentDetails.amount || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Payment Gateway:</td>
          <td style="padding:6px 0;">Paystack</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Transaction Date:</td>
          <td style="padding:6px 0;">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>

      ${paymentDetails.items && paymentDetails.items.length > 0 ? `
        <h3 style="color:#5b2b45;font-size:14px;margin:20px 0 10px 0;border-bottom:1px solid #f3dbe7;padding-bottom:4px;">Items Purchased</h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;color:#2b1d22;">
          <thead>
            <tr style="border-bottom:1px solid #f3dbe7;text-align:left;">
              <th style="padding:6px 0;color:#7a3855;font-weight:600;">Product</th>
              <th style="padding:6px 0;color:#7a3855;font-weight:600;text-align:center;width:60px;">Quantity</th>
              <th style="padding:6px 0;color:#7a3855;font-weight:600;text-align:right;width:100px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${paymentDetails.items.map(item => `
              <tr style="border-bottom:1px dashed #f5e4ec;">
                <td style="padding:6px 0;">${item.name || 'Product'}</td>
                <td style="padding:6px 0;text-align:center;">${item.quantity}</td>
                <td style="padding:6px 0;text-align:right;">GHS ${Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </div>
  `);

  return sendEmail({
    toEmail: email,
    toName: name,
    subject: "EL'S BRAIDS — Payment Receipt",
    htmlContent
  });
};

/**
 * 6. Send Payment Alert (Admin)
 */
const sendAdminPaymentAlert = async (admin, paymentDetails) => {
  const adminEmail = typeof admin === 'string' ? admin : admin.email;
  const customerName = paymentDetails.customerName || 'Customer';

  const htmlContent = emailLayout("New Payment Received", `
    <p>Hello Admin,</p>
    <p>A new payment transaction has been processed successfully through Paystack:</p>
    
    <div style="background-color:#fffafc;border:1px solid #ead4dd;border-radius:12px;padding:20px;margin:24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14px;color:#2b1d22;">
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;width:150px;">Customer Name:</td>
          <td style="padding:6px 0;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Customer Email:</td>
          <td style="padding:6px 0;">${paymentDetails.email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Reference:</td>
          <td style="padding:6px 0;font-weight:700;">${paymentDetails.paymentReference || paymentDetails.reference}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Total Amount:</td>
          <td style="padding:6px 0;font-weight:700;color:#0f5132;font-size:16px;">GHS ${Number(paymentDetails.total || paymentDetails.amount || 0).toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align:center;margin-top:28px;">
      <a href="https://elsbraids.com/admin" style="background-color:#5b2b45;color:#ffffff;text-decoration:none;padding:12px 24px;font-weight:bold;border-radius:8px;display:inline-block;">Open Admin Panel</a>
    </div>
  `);

  return sendEmail({
    toEmail: adminEmail,
    subject: `New Payment: GHS ${Number(paymentDetails.total || paymentDetails.amount || 0).toFixed(2)} - ${customerName}`,
    htmlContent
  });
};

/**
 * 7. Send Reminder Email (Customer)
 */
const sendReminderEmail = async (customer, appointmentDetails) => {
  const name = customer.fullName || customer.name || 'Valued Customer';
  const email = customer.email || appointmentDetails.email;

  const htmlContent = emailLayout("Appointment Reminder", `
    <p>Hello <strong>${name}</strong>,</p>
    <p>This is a friendly reminder that your hair appointment with El's Braids is scheduled for <strong>tomorrow</strong>!</p>
    
    <div style="background-color:#fffafc;border:1px solid #ead4dd;border-radius:12px;padding:20px;margin:24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14px;color:#2b1d22;">
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;width:120px;">Reference:</td>
          <td style="padding:6px 0;font-weight:700;color:#5b2b45;">${appointmentDetails.reference}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Service Name:</td>
          <td style="padding:6px 0;">${appointmentDetails.serviceName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Date:</td>
          <td style="padding:6px 0;">Tomorrow, ${appointmentDetails.date}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Time Slot:</td>
          <td style="padding:6px 0;font-weight:700;">${appointmentDetails.time}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Location:</td>
          <td style="padding:6px 0;">${appointmentDetails.location || 'Atonsu, Kumasi, Ghana'}</td>
        </tr>
      </table>
    </div>
    
    <p>We kindly ask that you arrive on time to ensure the best possible braiding experience. If you need to make changes, please reschedule as soon as possible.</p>
    
    <div style="text-align:center;margin-top:28px;">
      <a href="https://elsbraids.com/account/orders" style="background-color:#5b2b45;color:#ffffff;text-decoration:none;padding:12px 24px;font-weight:bold;border-radius:8px;display:inline-block;">View Booking Online</a>
    </div>
  `);

  return sendEmail({
    toEmail: email,
    toName: name,
    subject: `Reminder: Your appointment tomorrow at ${appointmentDetails.time}`,
    htmlContent
  });
};

/**
 * 8. Send Status Update Email (Customer)
 */
const sendStatusUpdateEmail = async (customer, bookingDetails, newStatus) => {
  const name = customer.fullName || customer.name || 'Valued Customer';
  const email = customer.email || bookingDetails.email;

  const htmlContent = emailLayout("Booking Status Updated", `
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your booking status has been updated by El's Braids. Here is the current information:</p>
    
    <div style="background-color:#fffafc;border:1px solid #ead4dd;border-radius:12px;padding:20px;margin:24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14px;color:#2b1d22;">
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;width:120px;">Reference:</td>
          <td style="padding:6px 0;font-weight:700;color:#5b2b45;">${bookingDetails.reference}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Service Name:</td>
          <td style="padding:6px 0;">${bookingDetails.serviceName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">Date/Time:</td>
          <td style="padding:6px 0;">${bookingDetails.date} at ${bookingDetails.time}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#7a3855;font-weight:600;">New Status:</td>
          <td style="padding:6px 0;font-weight:700;font-size:15px;color:${
            newStatus === 'Confirmed' || newStatus === 'Completed' ? '#0f5132' : newStatus === 'Cancelled' ? '#842029' : '#664d03'
          };">
            ${newStatus}
          </td>
        </tr>
      </table>
    </div>
  `);

  return sendEmail({
    toEmail: email,
    toName: name,
    subject: `Booking Status: ${newStatus} (${bookingDetails.reference})`,
    htmlContent
  });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendResetConfirmationEmail,
  sendBookingConfirmation,
  sendAdminBookingAlert,
  sendPaymentReceipt,
  sendAdminPaymentAlert,
  sendReminderEmail,
  sendStatusUpdateEmail
};
