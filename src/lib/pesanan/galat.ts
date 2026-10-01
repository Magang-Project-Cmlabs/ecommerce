export class BusinessValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'BusinessValidationError'; }
}
export function pesanGalat(error: unknown, fallback: string) {
  return error instanceof BusinessValidationError ? error.message : fallback;
}
export async function cobaUlangTransaksi<T>(work: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await work(); } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
      if (attempt >= 3 || !['P2034', 'P2002'].includes(String(code))) throw error;
    }
  }
}
