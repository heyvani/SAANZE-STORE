const crypto = require('crypto');

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

  const sigBuffer = Buffer.from(razorpay_signature, 'hex');
  const expBuffer = Buffer.from(expected, 'hex');
  const isValid = sigBuffer.length === expBuffer.length && crypto.timingSafeEqual(sigBuffer, expBuffer);

  if (!isValid) return res.status(400).json({ success: false, error: 'Signature mismatch' });

  return res.status(200).json({ success: true, payment_id: razorpay_payment_id, order_id: razorpay_order_id });
}