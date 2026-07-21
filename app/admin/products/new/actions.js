"use server";

import { db } from "@/lib/firebaseConfig"; // Your client SDK instance
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData) {
  const name = formData.get("name");
  const description = formData.get("description");
  const price = parseFloat(formData.get("price") || "0");
  const salePrice = formData.get("salePrice") ? parseFloat(formData.get("salePrice")) : null;
  const stock = parseInt(formData.get("stock") || "0", 10);
  const sku = formData.get("sku");
  const status = formData.get("status");
  const isFeatured = formData.get("isFeatured") === "on";
  const category = formData.get("category");
  const tagsInput = formData.get("tags") || "";

  const tags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  // Save to the "products" collection in Firestore
  await addDoc(collection(db, "products"), {
    name,
    description,
    price,
    salePrice,
    stock,
    sku,
    status,
    isFeatured,
    category,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/admin/products");
  redirect("/admin/products");
}