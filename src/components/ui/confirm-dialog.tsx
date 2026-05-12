'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from './dialog';
import { Button } from './button';

export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface Request extends ConfirmOptions {
  id: number;
  resolve: (ok: boolean) => void;
}

let nextId = 0;
const subscribers = new Set<(req: Request | null) => void>();
let currentRequest: Request | null = null;

function publish(req: Request | null): void {
  currentRequest = req;
  subscribers.forEach((cb) => cb(req));
}

export function customConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    publish({ ...options, id: ++nextId, resolve });
  });
}

export function ConfirmDialogHost() {
  const [request, setRequest] = useState<Request | null>(currentRequest);

  useEffect(() => {
    subscribers.add(setRequest);
    return () => {
      subscribers.delete(setRequest);
    };
  }, []);

  const handleClose = (ok: boolean): void => {
    if (!request) return;
    request.resolve(ok);
    publish(null);
  };

  const variant: ConfirmVariant = request?.variant ?? 'default';

  return (
    <Dialog open={request !== null} onOpenChange={(open) => { if (!open) handleClose(false); }}>
      <DialogContent showClose={false} className="max-w-md">
        <DialogTitle>{request?.title ?? ''}</DialogTitle>
        {request?.message ? <DialogDescription>{request.message}</DialogDescription> : null}
        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => handleClose(false)}>
            {request?.cancelLabel ?? 'Annuler'}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => handleClose(true)}
            autoFocus
          >
            {request?.confirmLabel ?? 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
