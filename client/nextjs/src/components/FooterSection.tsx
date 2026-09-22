'use client';

export default function FooterSection() {
  return (
    <footer id="footer" className="bg-ink-900 text-cream-100">
      <div className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <p className="font-display text-white text-2xl font-bold tracking-wide mb-4">Redis Shopping</p>
            <p className="text-cream-200/60 text-sm leading-relaxed max-w-sm">
              Curating the finest contemporary fashion from around the world. Style is not just what you wear — it&apos;s how you live.
            </p>
            <div className="flex gap-4 mt-6">
              {['fa-instagram', 'fa-tiktok', 'fa-facebook-f', 'fa-pinterest'].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  aria-label={icon}
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-cream-100/60 hover:border-terracotta-400 hover:text-terracotta-400 transition-colors"
                >
                  <i className={`fab ${icon} text-sm`} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-white font-semibold uppercase tracking-wider text-xs mb-5">Quick Links</p>
            <ul className="space-y-3">
              {[
                ['New Arrivals', '#'],
                ['Women', '#'],
                ['Men', '#'],
                ['Accessories', '#'],
                ['Sale', '#'],
              ].map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-cream-200/60 hover:text-terracotta-300 text-sm transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <p className="text-white font-semibold uppercase tracking-wider text-xs mb-5">Customer Care</p>
            <ul className="space-y-3">
              {[
                ['Track My Order', '#'],
                ['Returns & Exchanges', '#'],
                ['Size Guide', '#'],
                ['Contact Us', '#'],
                ['FAQ', '#'],
              ].map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-cream-200/60 hover:text-terracotta-300 text-sm transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream-200/40 text-xs">
            © 2026 Redis Shopping. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((label) => (
              <a key={label} href="#" className="text-cream-200/40 hover:text-cream-200/80 text-xs transition-colors">
                {label}
              </a>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            {['fa-cc-visa', 'fa-cc-mastercard', 'fa-cc-paypal'].map((icon) => (
              <i key={icon} className={`fab ${icon} text-cream-200/40 text-2xl`} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
