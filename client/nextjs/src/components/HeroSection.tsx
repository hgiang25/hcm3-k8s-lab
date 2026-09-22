'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const SLIDES = [
  {
    id: 1,
    headline: 'New Season,\nNew Statement',
    sub: 'Discover our Autumn / Winter 2026 collection — where timeless elegance meets contemporary design.',
    cta: 'Shop New Arrivals',
    badge: 'AW 2026 Collection',
    img: '/hero_fashion_banner.jpg',
    align: 'left',
  },
  {
    id: 2,
    headline: 'Style That\nSpeaks for You',
    sub: 'From boardroom to brunch — premium fashion crafted for every moment of your story.',
    cta: 'Explore Looks',
    badge: 'Curated Styles',
    img: '/promo_banner.jpg',
    align: 'left',
  },
];

export default function HeroSection({ onShopNow }: { onShopNow?: () => void }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
        setAnimating(false);
      }, 400);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ minHeight: '88vh' }}
    >
      {/* Background image */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${animating ? 'opacity-0' : 'opacity-100'}`}
      >
        <Image
          src={slide.img}
          alt="Hero fashion"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/75 via-ink-900/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 md:px-16 h-full flex items-center" style={{ minHeight: '88vh' }}>
        <div
          className={`max-w-xl transition-all duration-500 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
        >
          {/* Badge */}
          <span className="inline-block mb-4 px-3 py-1 bg-terracotta-500/90 text-white text-xs font-semibold uppercase tracking-widest rounded-full">
            {slide.badge}
          </span>

          {/* Headline */}
          <h1 className="font-display text-white text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            {slide.headline.split('\n').map((line, i) => (
              <span key={i} className={i === 1 ? 'text-terracotta-300' : ''}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h1>

          {/* Subheading */}
          <p className="text-cream-100/90 text-lg md:text-xl leading-relaxed mb-10 max-w-md">
            {slide.sub}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button
              id="hero-shop-now"
              onClick={onShopNow}
              className="px-8 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold uppercase tracking-wider rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {slide.cta}
            </button>
            <Link
              href="/orders"
              className="px-8 py-3.5 border border-white/60 text-white hover:bg-white/10 font-semibold uppercase tracking-wider rounded-full transition-all duration-200 backdrop-blur-sm"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => { setAnimating(true); setTimeout(() => { setCurrent(i); setAnimating(false); }, 300); }}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-terracotta-400' : 'w-2 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 z-10 hidden md:flex flex-col items-center gap-2 text-white/60">
        <span className="text-xs uppercase tracking-widest rotate-90 origin-center" style={{ writingMode: 'vertical-lr' }}>Scroll</span>
        <div className="w-px h-12 bg-white/40 animate-pulse" />
      </div>
    </section>
  );
}
