'use client';

import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      duration={3500}
      closeButton={false}
      richColors={false}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'group rounded-2xl border-0 bg-[rgba(0,0,0,0.85)] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] px-4 py-3 text-sm font-medium backdrop-blur',
          title: 'text-white',
          description: 'text-white/70',
          success: '!bg-[#fff056] !text-black',
          error: '!bg-[#d92020] !text-white',
          info: '!bg-[rgba(0,0,0,0.85)] !text-white',
          warning: '!bg-[#fb923c] !text-black',
          actionButton: 'rounded-full bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wider',
        },
      }}
      {...props}
    />
  );
}
