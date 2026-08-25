"use server";

import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

import { getStripeEnv } from "@/app/_lib/env";

export const createStripeCheckout = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const stripeEnv = getStripeEnv();
  const stripe = new Stripe(stripeEnv.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      success_url: `${stripeEnv.NEXT_PUBLIC_APP_URL}/subscription`,
      cancel_url: `${stripeEnv.NEXT_PUBLIC_APP_URL}/subscription`,
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
        },
      },
      line_items: [
        {
          price: stripeEnv.STRIPE_PREMIUM_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
    });
    return { sessionId: session.id };
  } catch (error) {
    // Erro mais comum aqui: STRIPE_SECRET_KEY e STRIPE_PREMIUM_PLAN_PRICE_ID
    // de modos diferentes (um em test, outro em live) — o Stripe responde
    // "No such price" nesse caso. Relançamos com uma mensagem que dá pra
    // diagnosticar sem precisar abrir os logs do servidor.
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Falha ao criar sessão de checkout no Stripe: ${message}`);
  }
};
