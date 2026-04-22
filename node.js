// ═══════════════════════════════════════════════════════
//  SAANZÉ — server.js
//  Express backend: serves static files + Razorpay API
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const crypto    = require('crypto');
const path      = require('path');
const Razorpay  = require('razorpay');

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Serve your static site files from /public ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Razorpay client (uses env vars — KEY_SECRET never reaches frontend) ──
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ════════════════════════════════════════════════════════
//  STEP 1 — POST /api/create-order
//  Called by frontend before opening Razorpay modal.
//  Creates a Razorpay order and returns the order_id.
// ════════════════════════════════════════════════════════
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Validate — Razorpay minimum is 100 paise (₹1)
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a number >= 100 paise'
      });
    }

    const options = {
      amount,           // already in paise — frontend must send ₹ × 100
      currency,
      receipt:  receipt || 'saanze_rcpt_' + Date.now(),
      notes:    notes   || {}
    };

    const order = await razorpay.orders.create(options);

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
    return res.status(500).json({ success: false, error: 'Failed to create order', detail: err.error?.description || err.message });
  }
});

// ════════════════════════════════════════════════════════
//  STEP 3 — POST /api/verify-payment
//  Called by frontend after Razorpay modal success.
//  Verifies HMAC-SHA256 signature — only mark paid if this passes.
// ════════════════════════════════════════════════════════
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate all three fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature'
      });
    }

    // Generate expected signature: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const sigBuffer      = Buffer.from(razorpay_signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    const isValid = sigBuffer.length === expectedBuffer.length &&
                    crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      console.warn('[verify-payment] Signature mismatch for order:', razorpay_order_id);
      return res.status(400).json({
        success: false,
        error: 'Payment signature verification failed'
      });
    }

    // ✅ Signature valid — payment is genuine
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