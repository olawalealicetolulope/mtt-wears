import React from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/authorizeAdmin";

const SignInPage = async () => {
  const session = await auth();
  const adminMail = session?.user?.email;

  // 1. Maintain Redirect users if already logged in (Server Side)
  if (session) {
    if (!adminEmails.includes(adminMail)) {
      redirect("/"); // Standard customer redirect
    } else {
      redirect("/admin"); // Admin panel redirect
    }
  }

  // Define input classes to match image_3.png
  const inputClasses =
    "w-full px-4 py-3 rounded-md border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm";

  // Define social button classes to match image_3.png
  const socialButtonClasses =
    "w-full flex items-center justify-center gap-3 border border-slate-100 rounded-md py-3 px-4 bg-white hover:bg-slate-50 transition font-medium text-slate-700 text-sm";

  return (
    <main className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4">
      {/* Centered Sign-In Card (image_3.png) */}
      <section className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8 border border-slate-100 flex flex-col items-center">
        
        {/* Updated Heading & Copy */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome to MTT Wears
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Sign in to explore premium fashion and manage your orders.
          </p>
        </div>

        {/* Email Sign-In Section */}
        <form
          action={async (formData) => {
            "use server";
            // Important: v5 uses Nodemailer provider, update accordingly if different
            await signIn("nodemailer", { email: formData.get("email") });
          }}
          className="space-y-3 w-full"
        >
          <div>
            <label htmlFor="email" className="sr-only">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Enter your email"
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition duration-150 text-sm"
          >
            Sign in with Email
          </button>
        </form>

        {/* Updated Divider */}
        <div className="relative my-6 flex items-center justify-center w-full">
          <div className="border-t border-slate-100 w-full" />
          <span className="bg-white px-3 text-xs font-normal text-slate-400 absolute">
            or continue with
          </span>
        </div>

        {/* Social Auth Buttons (image_3.png styled) */}
        <div className="space-y-3 w-full">
          
          {/* Google */}
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button type="submit" className={socialButtonClasses}>
              <FcGoogle className="text-xl" />
              <span>Continue with Google</span>
            </button>
          </form>

          {/* GitHub */}
          <form
            action={async () => {
              "use server";
              await signIn("github");
            }}
          >
            <button type="submit" className={socialButtonClasses}>
              <FaGithub className="text-xl text-slate-900" />
              <span>Continue with GitHub</span>
            </button>
          </form>

          {/* Twitter / X */}
          <form
            action={async () => {
              "use server";
              await signIn("twitter");
            }}
          >
            <button type="submit" className={socialButtonClasses}>
              <FaXTwitter className="text-lg text-slate-900" />
              <span>Continue with X (Twitter)</span>
            </button>
          </form>

        </div>

        {/* Refined Footer Legal Terms */}
        <p className="text-center text-[11px] leading-relaxed text-slate-400 mt-8 w-full">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-slate-900 font-semibold hover:underline">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-slate-900 font-semibold hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  );
};

export default SignInPage;