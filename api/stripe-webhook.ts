import { buffer } from 'micro';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-28.acacia',
});

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const sessionCompleted = event.data.object as Stripe.Checkout.Session;
      if (sessionCompleted.payment_status === 'paid') {
        console.log(`✅ Pago inmediato completado: ${sessionCompleted.id}`);
      }
      break;
    case 'checkout.session.async_payment_succeeded':
      const sessionSuccess = event.data.object as Stripe.Checkout.Session;
      console.log(`✅ Pago asincrónico acreditado: ${sessionSuccess.id}`);
      break;
    case 'checkout.session.async_payment_failed':
      const sessionFailed = event.data.object as Stripe.Checkout.Session;
      console.log(`❌ Pago asincrónico fallido: ${sessionFailed.id}`);
      break;
  }

  res.status(200).json({ received: true });
}
