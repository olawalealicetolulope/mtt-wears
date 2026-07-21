"use client";

import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { signIn } from "next-auth/react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { RiLoader4Fill } from "react-icons/ri";

const Email = () => {

  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 

  const schema = Yup.object().shape({
    email: Yup.string().email("Invalid email address").required("Email is required"),
  });

  const { handleSubmit, handleChange, values, errors, touched } = useFormik({
    initialValues: { email: "" },
    validationSchema: schema,
    onSubmit: async (values, { resetForm }) => {
      setProcessing(true);
      setMessage("");
      try {
        await addDoc(collection(db, "emails"), {
          email: values.email,
          createdAt: new Date(),
        });
        const res = await signIn("nodemailer", {
          email: values.email,
          redirect: false,
        });

        if (res?.ok) {
          setMessage("Check your email for a sign-in link.");
          setMessageType("success");
          resetForm();
        } else {
          setMessage("Authentication failed.");
          setMessageType("error");
        }
      } catch (err) {
        console.error("Error:", err);
        setMessage("Something went wrong. Try again.");
        setMessageType("error");
      } finally {
        setProcessing(false);
      }
    },
  });

  return (
    <div className="max-w-md mx-auto mt-10 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={values.email}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {errors.email && touched.email && (
          <p className="text-red-600 text-sm">{errors.email}</p>
        )}
          {message && (
          <p
            className={`text-sm mt-2 ${
              messageType === "success" ? "text-black" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <button
          disabled={processing}
          type="submit"
          className="bg-orange-600 text-white flex items-center justify-center p-3 rounded-md w-full font-semibold hover:bg-orange-500 transition-colors duration-200 outline-none"
        >
          {processing ? (
            <RiLoader4Fill className="animate-spin text-2xl" />
          ) : (
            "Sign in with Email"
          )}
        </button>

      
      </form>
    </div>
  );
};

export default Email;
