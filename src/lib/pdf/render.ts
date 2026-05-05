import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

// Render un Document PDF en Buffer pour servir via NextResponse.
// Accepte ReactElement<unknown> (sortie standard de nos composants typés) puis
// cast vers DocumentProps qu'attend renderToBuffer.
export async function pdfToBuffer(doc: ReactElement): Promise<Buffer> {
  return renderToBuffer(doc as ReactElement<DocumentProps>);
}
