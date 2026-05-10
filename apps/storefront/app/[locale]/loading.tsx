export default function Loading() {
  return (
    <main className="flex-1 flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-brand-muted">Laden…</p>
      </div>
    </main>
  );
}
