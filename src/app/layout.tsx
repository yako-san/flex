import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Flex',
  description: 'SaaS pour ateliers vélo',
};

// Root layout minimal : pas de <html>/<body> ici, c'est le layout localisé
// [locale]/layout.tsx qui les pose (avec lang correct).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
