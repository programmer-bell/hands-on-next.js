// src/app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0D0F1C] text-[#E2E4F0] font-sans antialiased">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#151828] border border-[#F43F5E]/30 rounded-xl p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-[#F43F5E]">Critical System Error</h2>
            <p className="text-[#6B7280] mb-8 text-sm">
              The application encountered a catastrophic failure at the root layout level.
              <br/>
              <span className="font-mono text-xs mt-2 block opacity-50 break-words text-left bg-black/20 p-2 rounded">
                {error.message || "Unknown root error"}
              </span>
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-[#00D4FF] text-[#0D0F1C] font-bold tracking-wider rounded-lg hover:opacity-90 transition-opacity uppercase text-sm"
            >
              Restart Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
