'use client';
import Image from 'next/image';

const PERKS = [
  { icon: 'fa-truck', title: 'Free Shipping', desc: 'On all orders over 500,000 VND. Fast & tracked nationwide delivery.' },
  { icon: 'fa-undo-alt', title: 'Easy Returns', desc: '30-day hassle-free returns. Shop with total confidence.' },
  { icon: 'fa-shield-alt', title: 'Secure Payment', desc: 'Your payment info is always encrypted and protected.' },
  { icon: 'fa-headset', title: '24/7 Support', desc: 'Our style advisors are available around the clock for you.' },
];

const TESTIMONIALS = [
  { name: 'Nguyễn Linh', role: 'Marketing Director', quote: 'The quality is absolutely stunning. I get compliments every time I wear pieces from this collection.', rating: 5 },
  { name: 'Trần Minh Khoa', role: 'Architect', quote: 'Clean, modern cuts that work perfectly from the office to after-work events. My go-to fashion destination.', rating: 5 },
  { name: 'Phạm Thu Hà', role: 'Fashion Blogger', quote: 'The curation is impeccable. Every season they nail the balance between trend-forward and timeless.', rating: 5 },
];

export default function BrandSection() {
  return (
    <>
      {/* ── PERKS strip ── */}
      <section id="perks" className="bg-ink-800 py-10">
        <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {PERKS.map((p) => (
            <div key={p.title} className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-terracotta-500/20 flex items-center justify-center">
                <i className={`fas ${p.icon} text-terracotta-300 text-xl`} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{p.title}</p>
                <p className="text-cream-200/60 text-xs mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT / BRAND STORY ── */}
      <section id="about" className="py-24 max-w-screen-xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* image */}
          <div className="relative rounded-2xl overflow-hidden shadow-card deco-frame" style={{ height: '520px' }}>
            <Image
              src="/brand_quality.jpg"
              alt="Our brand story – artisan craftsmanship"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {/* text */}
          <div>
            <span className="text-terracotta-500 text-sm font-semibold uppercase tracking-widest">Our Story</span>
            <h2 className="font-display text-ink-800 text-4xl md:text-5xl font-bold mt-3 mb-6 leading-tight">
              Crafted with<br />Intention
            </h2>
            <p className="text-ink-600 leading-relaxed mb-6">
              Born from a passion for authentic style, <strong className="text-ink-800">Redis Shopping</strong> was founded with one simple belief: fashion should feel as good as it looks. Every piece in our collection is thoughtfully sourced from artisan ateliers and sustainable manufacturers who share our commitment to quality.
            </p>
            <p className="text-ink-600 leading-relaxed mb-10">
              We don&apos;t follow fast fashion. We curate slow fashion — timeless pieces designed to last, made to be worn again and again, season after season.
            </p>
            <div className="grid grid-cols-3 gap-6">
              {[['12+', 'Years of Curation'], ['50K+', 'Happy Customers'], ['98%', 'Satisfaction Rate']].map(([num, label]) => (
                <div key={label}>
                  <p className="font-display text-terracotta-500 text-3xl font-bold">{num}</p>
                  <p className="text-ink-600 text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 bg-cream-100">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-terracotta-500 text-sm font-semibold uppercase tracking-widest">What our customers say</span>
            <h2 className="font-display text-ink-800 text-4xl font-bold mt-2">Loved by Thousands</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 shadow-card border border-terracotta-100/50 flex flex-col gap-4">
                {/* stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <i key={i} className="fas fa-star text-terracotta-400 text-sm" />
                  ))}
                </div>
                <p className="text-ink-700 leading-relaxed flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-terracotta-100">
                  <div className="w-10 h-10 rounded-full bg-terracotta-100 flex items-center justify-center">
                    <i className="fas fa-user text-terracotta-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-800 text-sm">{t.name}</p>
                    <p className="text-ink-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER BANNER ── */}
      <section id="newsletter" className="py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: '320px' }}>
            <Image
              src="/promo_banner.jpg"
              alt="Newsletter promo"
              fill
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center py-16 px-6" style={{ minHeight: '320px' }}>
              <span className="inline-block mb-3 px-3 py-1 bg-terracotta-500 text-white text-xs font-semibold uppercase tracking-widest rounded-full">
                Exclusive Access
              </span>
              <h2 className="font-display text-white text-3xl md:text-4xl font-bold mb-3">
                Get 15% Off Your First Order
              </h2>
              <p className="text-cream-100/80 mb-8 max-w-md">
                Subscribe to our newsletter and be the first to hear about new collections, exclusive offers, and style guides.
              </p>
              <form
                className="flex w-full max-w-md gap-3"
                onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing! 🎉'); }}
              >
                <input
                  type="email"
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-5 py-3 rounded-full bg-white/15 border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:border-terracotta-300 backdrop-blur-sm text-sm"
                />
                <button
                  type="submit"
                  id="newsletter-subscribe"
                  className="px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-full transition-colors text-sm uppercase tracking-wider whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
