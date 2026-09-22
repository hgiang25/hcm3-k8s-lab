import './globals.css';
import type { Metadata } from 'next';
import CartProvider from '@/components/CartProvider';

export const metadata: Metadata = {
  title: 'Redis Shopping',
  description: 'Shop with the speed of Redis!',
  icons: ['/favicon.ico'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-cream-50 text-ink-800">
        <CartProvider>{children}</CartProvider>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css"
        />
      </body>
    </html>
  );
}
