'use client';
import Image from 'next/image';

const CATEGORIES = [
  {
    id: 'women',
    title: "Women's Fashion",
    sub: '240+ styles',
    img: '/category_women.jpg',
    tag: 'Most popular',
    color: 'from-terracotta-800/70',
  },
  {
    id: 'men',
    title: "Men's Collection",
    sub: '180+ styles',
    img: '/category_men.jpg',
    tag: 'Trending now',
    color: 'from-ink-900/70',
  },
  {
    id: 'accessories',
    title: 'Accessories',
    sub: '350+ items',
    img: '/category_accessories.jpg',
    tag: 'New arrivals',
    color: 'from-ink-800/70',
  },
];

export default function CategorySection({ onCategoryClick }: { onCategoryClick?: (cat: string) => void }) {
  return (
    <section id="categories" className="py-20 max-w-screen-xl mx-auto px-6">
      {/* Section header */}
      <div className="text-center mb-12">
        <span className="text-terracotta-500 text-sm font-semibold uppercase tracking-widest">Browse by category</span>
        <h2 className="font-display text-ink-800 text-4xl md:text-5xl font-bold mt-2 mb-4">
          Shop Your Style
        </h2>
        <p className="text-ink-600 max-w-lg mx-auto text-base leading-relaxed">
          From refined elegance to casual chic — explore our curated collections and find the look that&apos;s unmistakably you.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`category-${cat.id}`}
            onClick={() => onCategoryClick?.(cat.id)}
            className="group relative overflow-hidden rounded-2xl cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
            style={{ height: '460px' }}
          >
            {/* image */}
            <Image
              src={cat.img}
              alt={cat.title}
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            {/* overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} via-transparent to-transparent opacity-80`} />
            {/* content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {cat.tag && (
                <span className="inline-block mb-2 px-2.5 py-0.5 bg-terracotta-500 text-white text-xs font-semibold rounded-full uppercase tracking-wider">
                  {cat.tag}
                </span>
              )}
              <h3 className="font-display text-white text-2xl font-bold leading-tight">{cat.title}</h3>
              <p className="text-cream-100/80 text-sm mt-1">{cat.sub}</p>
              <div className="mt-4 flex items-center gap-1 text-terracotta-300 text-sm font-semibold group-hover:gap-3 transition-all duration-300">
                Shop now <i className="fas fa-arrow-right text-xs" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
