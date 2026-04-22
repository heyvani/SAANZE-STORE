// ═══════════════════════════════════════════════════════
//  SAANZÉ — server.js
//  Express backend: serves static files + Razorpay API
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const crypto   = require('crypto');
const path     = require('path');
const Razorpay = require('razorpay');

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Serve static site files from /public ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Razorpay client (KEY_SECRET stays server-side only) ──
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ════════════════════════════════════════════════════════
//  POST /api/create-order
//  Called by frontend before opening Razorpay modal.
// ════════════════════════════════════════════════════════
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || typeof amount !== 'number' || amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a number >= 100 paise'
      });
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt:  receipt || 'saanze_rcpt_' + Date.now(),
      notes:    notes   || {}
    });

    return res.status(200).json({
      success:  true,
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency
    });

  } catch (err) {
    console.error('[create-order] Razorpay error:', err);
    if (err.statusCode === 401) {
      return res.status(401).json({ success: false, error: 'Invalid Razorpay credentials' });
    }
    return res.status(500).json({
      success: false,
      error:   'Failed to create order',
      detail:  err.error?.description || err.message
    });
  }
});

// ════════════════════════════════════════════════════════
//  POST /api/verify-payment
//  Verifies HMAC-SHA256 signature after payment success.
// ════════════════════════════════════════════════════════
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error:   'Missing required fields'
      });
    }

    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const sigBuffer      = Buffer.from(razorpay_signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    const isValid =
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      console.warn('[verify-payment] Signature mismatch for order:', razorpay_order_id);
      return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
    }

    console.log('[verify-payment] ✅ Payment verified:', razorpay_payment_id);
    return res.status(200).json({
      success:    true,
      payment_id: razorpay_payment_id,
      order_id:   razorpay_order_id,
      message:    'Payment verified successfully'
    });

  } catch (err) {
    console.error('[verify-payment] Error:', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ── Fallback: serve index.html for any non-API route ──
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start server ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Saanzé server running at http://localhost:${PORT}`);
  console.log(`   Razorpay Key: ${process.env.RAZORPAY_KEY_ID}`);
  console.log(`   Mode: ${process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live') ? '🟢 LIVE' : '🟡 TEST'}\n`);
});