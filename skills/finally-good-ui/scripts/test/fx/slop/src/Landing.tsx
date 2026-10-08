import { Sparkles, Rocket, Check } from "lucide-react";
export default function Landing() {
  return (
    <main>
      <h1 className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Ship faster</h1>
      <p>Unlock seamless workflows that empower your team.</p>
      <a href="#">Pricing</a>
      <button onClick={() => {}}>Get started</button>
      <p>Trusted by 10,000+ teams · SOC 2 compliant · 99.9% uptime</p>
      <img src="https://i.pravatar.cc/80" alt="Jane Doe" />
      <p>Lorem ipsum dolor sit amet</p>
      <div className="absolute -top-20 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" aria-hidden="true" />
      <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
      <p>Invoices go out on time — every time.</p>
      <td>—</td>
      <a href="#main">Skip to content</a>
      <section className="min-h-screen">🚀 Launch</section>
      {/* TODO: wire up the rest of the sections */}
      <p className="text-xs uppercase tracking-widest">Features</p>
      <p className="text-xs uppercase tracking-widest">Pricing</p>
      <p className="text-xs uppercase tracking-widest">FAQ</p>
      <p className="text-xs uppercase tracking-widest">Contact</p>
    </main>
  );
}
