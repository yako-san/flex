'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UploadIcon, XIcon } from '@/components/icons';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';
import { uploadBdcPhotoAction } from './photo-actions';

type Props = {
  bdcId: string;
};

const KIND_OPTIONS = [
  { value: 'AVANT', label: 'Avant' },
  { value: 'APRES', label: 'Après' },
  { value: 'DEGAT', label: 'Dégât' },
  { value: 'SERIE', label: 'N° série' },
  { value: 'AUTRE', label: 'Autre' },
] as const;

type PhotoKind = (typeof KIND_OPTIONS)[number]['value'];

type QueuedFile = {
  id: string;
  file: File;
  kind: PhotoKind;
  caption: string;
};

export function BdcPhotoUpload({ bdcId }: Props) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) {
      toast('Aucun fichier image valide', 'warning');
      return;
    }
    setQueue((q) => [
      ...q,
      ...arr.map((file) => ({
        id: crypto.randomUUID(),
        file,
        kind: 'AUTRE' as PhotoKind,
        caption: '',
      })),
    ]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const removeFromQueue = (id: string) => {
    setQueue((q) => q.filter((qf) => qf.id !== id));
  };

  const updateKind = (id: string, kind: PhotoKind) => {
    setQueue((q) => q.map((qf) => (qf.id === id ? { ...qf, kind } : qf)));
  };

  const updateCaption = (id: string, caption: string) => {
    setQueue((q) => q.map((qf) => (qf.id === id ? { ...qf, caption } : qf)));
  };

  const upload = () => {
    startTransition(async () => {
      let ok = 0;
      let fail = 0;
      for (const qf of queue) {
        const fd = new FormData();
        fd.set('bdcId', bdcId);
        fd.set('file', qf.file);
        fd.set('kind', qf.kind);
        if (qf.caption.trim()) fd.set('caption', qf.caption.trim());
        const r = await uploadBdcPhotoAction(fd);
        if (r.ok) ok++;
        else {
          fail++;
          toast(`${qf.file.name} : ${r.error}`, 'error');
        }
      }
      if (ok > 0) {
        toast(`${ok} photo${ok > 1 ? 's' : ''} ajoutée${ok > 1 ? 's' : ''}${fail > 0 ? ` (${fail} échec${fail > 1 ? 's' : ''})` : ''}`, fail === 0 ? 'success' : 'warning');
        setQueue([]);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-6 text-xs transition-colors',
          dragOver
            ? 'border-[var(--jaune)] bg-[var(--jaune)]/10'
            : 'border-[var(--gris-bord)] bg-white/40 hover:border-[var(--jaune)] hover:bg-[var(--jaune)]/5',
        )}
      >
        <UploadIcon width={20} height={20} className="text-[var(--text-secondary-60)]" />
        <span className="font-semibold text-[var(--text-secondary-70)]">
          Glisse une image ici ou clique pour choisir
        </span>
        <span className="text-[10px] text-[var(--text-secondary-60)]">
          JPG, PNG, WebP, HEIC — max 10 Mo
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </button>

      {queue.length > 0 ? (
        <div className="space-y-2 rounded-2xl bg-white/85 p-3 shadow-sm">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
            File d&apos;attente ({queue.length})
          </h3>
          {queue.map((qf) => (
            <QueueItem
              key={qf.id}
              qf={qf}
              onKind={(k) => updateKind(qf.id, k)}
              onCaption={(c) => updateCaption(qf.id, c)}
              onRemove={() => removeFromQueue(qf.id)}
            />
          ))}
          <button
            type="button"
            onClick={upload}
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--jaune)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--jaune-h)] disabled:opacity-50"
          >
            <UploadIcon width={14} height={14} />
            {pending ? `UploadIcon (${queue.length})…` : `Téléverser ${queue.length} photo${queue.length > 1 ? 's' : ''}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function QueueItem({
  qf,
  onKind,
  onCaption,
  onRemove,
}: {
  qf: QueuedFile;
  onKind: (k: PhotoKind) => void;
  onCaption: (c: string) => void;
  onRemove: () => void;
}) {
  // Preview locale via FileReader
  const [preview, setPreview] = useState<string | null>(null);
  if (!preview) {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(typeof e.target?.result === 'string' ? e.target.result : null);
    reader.readAsDataURL(qf.file);
  }

  return (
    <div className="flex gap-2 rounded-xl bg-[var(--gris-fond)] p-2">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--gris-bord)]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={qf.file.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-[var(--text-secondary-60)]">…</span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold">{qf.file.name}</div>
            <div className="text-[10px] text-[var(--text-secondary-60)]">
              {(qf.file.size / 1024).toFixed(0)} KB · {qf.file.type}
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--rouge)] hover:bg-[var(--rouge)]/10"
            aria-label="Retirer de la file"
          >
            <XIcon width={14} height={14} />
          </button>
        </div>
        <div className="flex gap-1">
          <select
            value={qf.kind}
            onChange={(e) => onKind(e.target.value as PhotoKind)}
            className="input-system"
            style={{ width: 100 }}
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            value={qf.caption}
            onChange={(e) => onCaption(e.target.value)}
            placeholder="Légende (optionnel)"
            className="input-system"
          />
        </div>
      </div>
    </div>
  );
}
