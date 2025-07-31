import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quick Blackjack',
  description: 'A simple and fast Blackjack game with AI-powered advice.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous">
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
