import localFont from 'next/font/local';
import './globals.css';

const geistMono = localFont({
  src: [
    {
      path: '../fonts/GeistMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/GeistMono-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/GeistMono-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/GeistMono-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/GeistMono-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-geist-mono'
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable}`}>{children}</body>
    </html>
  );
}