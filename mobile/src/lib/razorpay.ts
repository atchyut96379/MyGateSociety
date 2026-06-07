import { ApiError, api } from "../api/client";

type RazorpayNative = {
  open: (options: Record<string, unknown>) => Promise<{
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }>;
};

function getRazorpayNative(): RazorpayNative | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-razorpay").default as RazorpayNative;
  } catch {
    return null;
  }
}

export async function payBillWithRazorpay(
  token: string,
  billId: string,
  user: { name: string; phone: string; email?: string | null }
): Promise<void> {
  const RazorpayCheckout = getRazorpayNative();
  if (!RazorpayCheckout) {
    throw new ApiError(
      503,
      "Online payment requires the Marvel Rocks app build (not Expo Go). Reinstall the preview APK from EAS."
    );
  }

  const order = await api.createRazorpayOrder(token, billId);

  try {
    const response = await RazorpayCheckout.open({
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
    });

    await api.verifyRazorpayPayment(token, billId, response);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 0) {
      throw new ApiError(499, "Payment cancelled");
    }
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : "Payment failed";
    throw new ApiError(400, message);
  }
}
