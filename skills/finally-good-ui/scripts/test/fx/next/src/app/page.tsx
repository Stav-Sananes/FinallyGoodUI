"use client";
import { motion } from "motion/react";

export default function Page() {
  return (
    <main className="p-4">
      <button className="transition-all duration-700 outline-none">Save</button>
      <button className="outline-none focus-visible:ring-2">Ok</button>
      <img src="/hero.png" />
      <img src="/logo.png" alt="Logo" />
      <div onClick={() => alert("hi")}>Click me</div>
      <div role="button" tabIndex={0} onClick={() => alert("ok")}>Fine</div>
      <div className="bg-[#ff0000] p-[13px]">Red</div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.8 }} />
      <div className="ease-in animate-spin duration-1000">spinner</div>
      <input className="text-sm" />
      <input className="text-base md:text-sm" />
    </main>
  );
}
