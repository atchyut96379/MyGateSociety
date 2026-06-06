import { ApiError, api } from "../api/client";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export async function payBillWithRazorpay(
  token: string,
  billId: string,
  user: { name: string; phone: string; email?: string | null }
): Promise<void> {
  await loadRazorpayScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay checkout is unavailable");
  }

  const order = await api.createRazorpayOrder(token, billId);

  await new Promise<void>((resolve, reject) => {
    const checkout = new window.Razorpay!({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: order.society_name,
      description: order.description,
      order_id: order.order_id,
      prefill: {
        name: user.name,
        contact: user.phone,
        email: user.email ?? undefined,
      },
      theme: { color: "#0d6e4f" },
      handler: async (response: RazorpayHandlerResponse) => {
        try {
          await api.verifyRazorpayPayment(token, billId, response);
          resolve();
        } catch (err) {
          reject(err instanceof ApiError ? err : new Error("Payment verification failed"));
        }
      },
      modal: {
        ondismiss: () => reject(new ApiError(499, "Payment cancelled")),
      },
    });

    checkout.on("payment.failed", (response) => {
      reject(new ApiError(400, response.error?.description ?? "Payment failed"));
    });

    checkout.open();
  });
}
