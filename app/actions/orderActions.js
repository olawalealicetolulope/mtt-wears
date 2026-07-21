"use server";

import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(orderId, newStatus) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: new Date(),
    });

    // Refresh the page data seamlessly
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePaymentStatusAction(orderId, newPaymentStatus) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      paymentStatus: newPaymentStatus,
      updatedAt: new Date(),
    });

    // Refresh the page data seamlessly
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update payment status:", error);
    return { success: false, error: error.message };
  }
}