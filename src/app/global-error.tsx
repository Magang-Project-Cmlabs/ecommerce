'use client';
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="id"><body style={{ fontFamily: 'system-ui, sans-serif', padding: '48px 20px', textAlign: 'center', color: '#18181b', margin: 0 }}><main><h1 style={{ fontSize: 24 }}>TokoKita belum dapat dimuat</h1><p>Terjadi kendala sementara. Silakan coba kembali.</p><button onClick={reset} style={{ minHeight: 44, padding: '12px 24px', border: '1px solid #d4d4d8', borderRadius: 8, background: '#f97316', color: '#09090b', fontSize: 16, cursor: 'pointer' }}>Coba lagi</button></main></body></html>;
}
