'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ImageOff, X } from 'lucide-react';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';
import { deleteBdcPhotoAction } from './photo-actions';

export type BdcPhotoLite = {
  id: string;
  blobUrl: string;
  caption: string | null;
  kind: 'AVANT' | 'APRES' | 'DEGAT' | 'SERIE' | 'AUTRE';
  position: number;
};

type Props = {
  photos: BdcPhotoLite[];
};

const KIND_BG: Record<BdcPhotoLite['kind'], string> = {
  AVANT: 'var(--st-rv-bg)',
  APRES: 'var(--st-approuve-bg)',
  DEGAT: 'var(--rouge)',
  SERIE: 'var(--st-attente-bg)',
  AUTRE: 'rgba(0,0,0,0.40)',
};
const KIND_FG: Record<BdcPhotoLite['kind'], string> = {
  AVANT: '#000',
  APRES: '#000',
  DEGAT: '#fff',
  SERIE: '#000',
  AUTRE: '#fff',
};

export function BdcPhotoGallery({ photos }: Props) {
  const [zoomed, setZoomed] = useState<BdcPhotoLite | null>(null);

  if (photos.length === 0) {
    return (
      <p className="flex items-center gap-1 px-3 py-4 text-center text-xs italic text-[var(--text-secondary-60)]">
        <ImageOff size={14} />
        Aucune photo. Glisse une image dans la zone d&apos;upload pour démarrer.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((p) => (
          <PhotoThumb key={p.id} photo={p} onZoom={() => setZoomed(p)} />
        ))}
      </div>

      {zoomed ? <Lightbox photo={zoomed} onClose={() => setZoomed(null)} /> : null}
    </>
  );
}

function PhotoThumb({ photo, onZoom }: { photo: BdcPhotoLite; onZoom: () => void }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await customConfirm({
      title: 'Supprimer cette photo ?',
      message: 'Action réversible (soft delete) — le fichier reste sur Vercel Blob jusqu\'au job de purge.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    start(async () => {
      const r = await deleteBdcPhotoAction(photo.id);
      if (!r.ok) {
        toast(r.error, 'error');
      } else {
        toast('Photo supprimée', 'success');
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onZoom}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-xl bg-[var(--gris-fond)] shadow-sm transition-opacity',
        pending && 'opacity-40',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.blobUrl}
        alt={photo.caption ?? `Photo ${photo.kind.toLowerCase()}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <span
        className="absolute left-1 top-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
        style={{ backgroundColor: KIND_BG[photo.kind], color: KIND_FG[photo.kind] }}
      >
        {photo.kind}
      </span>
      <span
        role="button"
        tabIndex={0}
        aria-label="Supprimer la photo"
        onClick={handleDelete}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleDelete(e as unknown as React.MouseEvent);
        }}
        className="absolute right-1 top-1 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Trash2 size={12} />
      </span>
      {photo.caption ? (
        <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-left text-[10px] text-white">
          {photo.caption}
        </span>
      ) : null}
    </button>
  );
}

function Lightbox({ photo, onClose }: { photo: BdcPhotoLite; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Photo agrandie"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Fermer"
      >
        <X size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.blobUrl}
        alt={photo.caption ?? `Photo ${photo.kind.toLowerCase()}`}
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {photo.caption ? (
        <p className="absolute bottom-4 left-1/2 max-w-[80%] -translate-x-1/2 rounded-2xl bg-black/60 px-4 py-2 text-center text-sm text-white">
          {photo.caption}
        </p>
      ) : null}
    </div>
  );
}
