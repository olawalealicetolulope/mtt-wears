import { handlers } from "@/auth";

export async function GET(req, ctx) {
  try {
    return await handlers.GET(req, ctx);
  } catch (error) {
    console.error("NextAuth GET Route Error:", error);
    throw error;
  }
}

export async function POST(req, ctx) {
  try {
    return await handlers.POST(req, ctx);
  } catch (error) {
    console.error("NextAuth POST Route Error:", error);
    throw error;
  }
}