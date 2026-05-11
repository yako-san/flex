import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flex',
  description: 'SaaS pour ateliers vélo',
  // Favicon dynamique : sert le logo du workshop actif si configuré, sinon
  // 404 (le navigateur tombe sur le default Next.js).
  icons: {
    icon: [{ url: '/api/workshop/logo', type: 'image/png' }],
  },
};

// Root layout minimal : pas de <html>/<body> ici, c'est le layout localisé
// [locale]/layout.tsx qui les pose (avec lang correct).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
