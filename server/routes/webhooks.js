const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Booking, Order, Payment } = require('../models');
const { isDatabaseReady } = require('../utils/database');
const { inMemoryStore } = require('../data/sampleData');

// ─── Email helper ─────────────────────────────────────────────────────────────

const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT || 587) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });
};

const sendConfirmationEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[webhook] Email not configured — skipping confirmation email to:', to);
    return false;
  }
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject, html });
    console.log('[webhook] Confirmation email sent to:', to);
    return true;
  } catch (error) {
    console.error('[webhook] Failed to send confirmation email:', error.message);
    return false;
  }
};

const bookingConfirmationHtml = (booking) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
  <div style="background:#5b2b45;padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">EL'S BRAIDS</h1>
    <p style="color:#f9d8e8;margin:6px 0 0">Booking Confirmed &#10003;</p>
  </div>
  <div style="padding:28px 24px;background:#fff">
    <p>Hi <strong>${booking.customerName}</strong>,</p>
    <p>Your booking has been confirmed and payment received. Here are your details:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f7f0f4"><td style="padding:10px 12px;font-weight:bold;width:40%">Reference</td><td style="padding:10px 12px">${booking.reference}</td></tr>
      <tr><td style="padding:10px 12px;font-weight:bold">Service</td><td style="padding:10px 12px">${booking.serviceName}</td></tr>
      <tr style="background:#f7f0f4"><td style="padding:10px 12px;font-weight:bold">Date</td><td style="padding:10px 12px">${booking.date}</td></tr>
      <tr><td style="padding:10px 12px;font-weight:bold">Time</td><td style="padding:10px 12px">${booking.time}</td></tr>
      <tr style="background:#f7f0f4"><td style="padding:10px 12px;font-weight:bold">Location</td><td style="padding:10px 12px">${booking.location || 'Atonsu, Kumasi, Ghana'}</td></tr>
      <tr><td style="padding:10px 12px;font-weight:bold">Amount Paid</td><td style="padding:10px 12px">GHS ${Number(booking.paymentAmount || 0).toFixed(2)}</td></tr>
    </table>
    <p>We look forward to seeing you! If you need to make any changes, please contact us.</p>
  </div>
  <div style="background:#f7f0f4;padding:16px 24px;text-align:center;font-size:13px;color:#888">
    <p>EL'S BRAIDS &bull; Atonsu, Kumasi, Ghana</p>
  </div>
</div>
`;

const orderConfirmationHtml = (order) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
  <div style="background:#5b2b45;padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">EL'S BRAIDS</h1>
    <p style="color:#f9d8e8;margin:6px 0 0">Order Confirmed &#10003;</p>
  </div>
  <div style="padding:28px 24px;background:#fff">
    <p>Hi <strong>${order.customerName}</strong>,</p>
    <p>Your order has been confirmed and payment received. Here are your details:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f7f0f4"><td style="padding:10px 12px;font-weight:bold;width:40%">Reference</td><td style="padding:10px 12px">${order.paymentReference || String(order._id)}</td></tr>
      <tr><td style="padding:10px 12px;font-weight:bold">Delivery Address</td><td style="padding:10px 12px">${order.address}, ${order.city}, ${order.region}</td></tr>
      <tr style="background:#f7f0f4"><td style="padding:10px 12px;font-weight:bold">Total</td><td style="padding:10px 12px">GHS ${Number(order.total || order.subtotal || 0).toFixed(2)}</td></tr>
    </table>
    ${Array.isArray(order.items) && order.items.length > 0 ? `
    <h3 style="font-size:15px;margin:20px 0 8px">Items Ordered</h3>
    <table style="width:100%;border-collapse:collapse">
      ${order.items.map((item, i) => `
      <tr style="${i % 2 === 0 ? 'background:#f7f0f4' : ''}">
        <td style="padding:8px 12px">${item.name}</td>
        <td style="padding:8px 12px;text-align:center">x${item.quantity}</td>
        <td style="padding:8px 12px;text-align:right">GHS ${Number(item.price * item.quantity).toFixed(2)}</td>
      </tr>`).join('')}
    </table>` : ''}
    <p style="margin-top:20px">We will process your order shortly. Thank you for shopping with us!</p>
  </div>
  <div style="background:#f7f0f4;padding:16px 24px;text-align:center;font-size:13px;color:#888">
    <p>EL'S BRAIDS &bull; Atonsu, Kumasi, Ghana</p>
  </div>
</div>
`;

// ─── Webhook route ────────────────────────────────────────────────────────────
// IMPORTANT: This route receives a raw Buffer body (express.raw middleware is
// applied in server.js specifically for this path, before express.json).

router.post('/paystack', async (req, res) => {
  // 1. Verify PAYSTACK_SECRET_KEY is configured
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('[webhook] PAYSTACK_SECRET_KEY not configured');
    return res.sendStatus(500);
  }

  // 2. Verify Paystack HMAC-SHA512 signature
  const signature = req.headers['x-paystack-signature'];
  if (!signature) {
    console.warn('[webhook] Missing x-paystack-signature header');
    return res.sendStatus(400);
  }

  const rawBody = req.body; // Buffer — preserved by express.raw()
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
    console.warn('[webhook] Signature mismatch — rejected');
    return res.sendStatus(401);
  }

  // 3. Parse event payload
  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    console.error('[webhook] Failed to parse webhook body as JSON');
    return res.sendStatus(400);
  }

  const { reference, status } = event.data || {};
  console.log('[webhook] Event:', event.event, '| Reference:', reference, '| Status:', status);

  // 4. Acknowledge immediately — Paystack requires 200 within 5 seconds
  res.sendStatus(200);

  // 5. Only process charge.success events
  if (event.event !== 'charge.success' || status !== 'success' || !reference) {
    return;
  }

  // 6. Process payment async (after 200 already sent)
  try {
    if (isDatabaseReady()) {
      await processWebhookDB(reference);
    } else {
      processWebhookMemory(reference);
    }
  } catch (error) {
    console.error('[webhook] Error during post-200 processing:', error.message);
  }
});

// ─── MongoDB processing ───────────────────────────────────────────────────────

async function processWebhookDB(reference) {
  // Find and update the Payment record
  const payment = await Payment.findOneAndUpdate(
    { reference },
    { $set: { status: 'Paid' } },
    { new: true },
  ).lean();

  if (!payment) {
    console.warn('[webhook] No Payment record found for reference:', reference);
    return;
  }
  console.log('[webhook] Payment updated to Paid:', { reference, _id: String(payment._id) });

  // If this payment is linked to a Booking
  if (payment.bookingId) {
    const booking = await Booking.findByIdAndUpdate(
      payment.bookingId,
      { $set: { paymentStatus: 'Paid' } },
      { new: true },
    ).lean();

    if (booking) {
      console.log('[webhook] Booking paymentStatus → Paid:', { ref: booking.reference, email: booking.email });
      await sendConfirmationEmail({
        to: booking.email,
        subject: "EL'S BRAIDS — Your booking is confirmed!",
        html: bookingConfirmationHtml(booking),
      });
    }
  }

  // If this payment is linked to an Order
  if (payment.orderId) {
    const order = await Order.findByIdAndUpdate(
      payment.orderId,
      { $set: { paymentStatus: 'Paid' } },
      { new: true },
    ).lean();

    if (order) {
      console.log('[webhook] Order paymentStatus → Paid:', { _id: String(order._id), email: order.email });
      await sendConfirmationEmail({
        to: order.email,
        subject: "EL'S BRAIDS — Your order is confirmed!",
        html: orderConfirmationHtml(order),
      });
    }
  }
}

// ─── In-memory processing (dev/demo mode, no MongoDB) ────────────────────────

function processWebhookMemory(reference) {
  const booking = inMemoryStore.bookings.find(
    (b) => b.paymentReference === reference || b.reference === reference,
  );
  if (booking) {
    booking.paymentStatus = 'Paid';
    console.log('[webhook][memory] Booking paymentStatus → Paid:', booking.reference);
    return;
  }

  const order = inMemoryStore.orders.find((o) => o.paymentReference === reference);
  if (order) {
    order.paymentStatus = 'Paid';
    console.log('[webhook][memory] Order paymentStatus → Paid:', reference);
    return;
  }

  console.warn('[webhook][memory] No booking or order matched reference:', reference);
}

module.exports = router;
