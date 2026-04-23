export default function handler(req, res) {
  res.status(200).json({ key_id: process.env.RAZORPAY_KEY_ID });
}