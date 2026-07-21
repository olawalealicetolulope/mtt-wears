import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="bg-black text-white min-h-screen pb-4 px-4 sm:px-6 lg:px-8">
      
<div className="max-w-6xl mx-auto">
      {/* Editorial Header Section */}
      <section className="text-center py-20 px-6">
      {/* <section className="max-w-4xl mx-auto text-center mb-24"> */}
        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase border border-neutral-800 rounded-full px-4 py-1.5 inline-block mb-6">
          MTT WEARS / IDENTITY
        </span>
        <p className="text-neutral-350 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          MTT Wears is more than a streetwear label. It is a philosophy of self-expression, 
          designed to bridge the gap between heavyweight utility and effortless confidence.
        </p>
      </section>

      {/* Brand Story Split Row Section */}
    {/* ─── SECTION 1: OUR ORIGIN ─── */}
       <section className="max-w-6xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-2 gap-12 md:gap-20 items-center ">
        {/* Story Image Container */}
        <div className="relative aspect-[4/3] sm:aspect-[4/5] w-full overflow-hidden rounded-3xl bg-neutral-950 border border-neutral-900 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop"
            alt="MTT Wears Brand Story"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        {/* Story Text */}
        <div className="space-y-6">
          <span className="text-xs font-mono text-neutral-500 tracking-wider">
            [ OUR ORIGIN ]
          </span>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">
            Crafted for the Bold
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Founded with a vision to redefine modern street fashion, MTT Wears curates limited capsule drops engineered for comfort, durability, and raw aesthetic appeal. 
          </p>
          <p className="text-neutral-400 text-sm leading-relaxed">
            We believe that clothing is an extension of identity. That is why every garment we drop is meticulously designed with heavy-grade premium cotton, precise oversized cuts, and minimalist branding to make sure you never blend into the background.
          </p>
          
          <blockquote className="border-l border-neutral-700 pl-4 my-4">
            <p className="italic text-neutral-300 text-xs sm:text-sm">
              &quot;True style is not about being noticed, it is about being remembered.
            </p>
          </blockquote>
        </div>
      </section>

      {/* ─── SPACED HORIZONTAL DIVIDER ─── */}
      <hr className="max-w-6xl mx-auto border-neutral-900 my-20 sm:my-32 pt-10" />

      {/* ─── SECTION 2: CORE VALUES / PILLARS ─── */}
      <section className="max-w-6xl mx-auto border-neutral-900 pb-10 mb-32">
        <div className="text-center md:text-left mb-12">
          <span className="text-xs font-mono text-neutral-500 tracking-wider">
            [ OUR FOUNDATION ]
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold uppercase mt-2">
            The Pillars of MTT
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="bg-neutral-950/50 border border-neutral-900 p-8 rounded-2xl">
            <div className="text-neutral-500 text-xs font-mono mb-4">01 / PREMIUM UTILITY</div>
            <h3 className="text-lg font-bold uppercase mb-2">Uncompromised Quality</h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              We source only the highest grade, heavyweight custom-milled fabrics. Our garments are built to survive the elements of daily city life.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-neutral-950/50 border border-neutral-900 p-8 rounded-2xl">
            <div className="text-neutral-500 text-xs font-mono mb-4">02 / NATURAL GLOW</div>
            <h3 className="text-lg font-bold uppercase mb-2">Radiant Confidence</h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Your glow comes from confidence. Our signature drapes and minimalist silhouettes are crafted specifically to amplify your presence.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-neutral-950/50 border border-neutral-900 p-8 rounded-2xl">
            <div className="text-neutral-500 text-xs font-mono mb-4">03 / EXCLUSIVITY</div>
            <h3 className="text-lg font-bold uppercase mb-2">Curated Drops</h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              We do not believe in fast fashion or mass production. MTT Wears runs limited capsule releases. Once a design is sold out, it is gone forever.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="max-w-4xl mx-auto text-center border border-neutral-900 bg-neutral-950/30 rounded-3xl p-12 sm:p-16">
        <h2 className="text-2xl sm:text-4xl font-extrabold uppercase mb-4">
          Become Part of the Collective
        </h2>
        <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto mb-8 leading-relaxed">
          Explore our latest curated streetwear collections and upgrade your rotation today.
        </p>
        <Link 
          href="/collections"
          className="group inline-flex items-center gap-3 bg-white text-black text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-full hover:bg-neutral-200 transition-all duration-300"
        >
          Explore Drops
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </Link>
      </section>
      </div>
    </main>
  );
}