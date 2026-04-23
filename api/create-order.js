const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { amount, currency = 'INR', receipt, notes } = req.body;

  if (!amount || typeof amount !== 'number' || amount < 100) {
    return res.status(400).json({ success: false, error: 'amount must be >= 100 paise' });
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt || 'saanze_rcpt_' + Date.now(),
      notes: notes || {}
    });
    return res.status(200).json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}