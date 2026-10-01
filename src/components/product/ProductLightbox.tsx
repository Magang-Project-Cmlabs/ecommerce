'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

export default function ProductLightbox({ images, name, index, close }: { images: string[]; name: string; index: number; close: () => void }) {
  return <Lightbox open close={close} index={index} slides={images.map((src) => ({ src, alt: name }))} plugins={[Zoom]} labels={{ Close: 'Tutup', Next: 'Foto berikutnya', Previous: 'Foto sebelumnya', 'Zoom in': 'Perbesar', 'Zoom out': 'Perkecil' }} />;
}
