import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <header className="bg-surface border-b border-surface-container-highest px-6 py-4 flex justify-between items-center">
        <h1 className="font-headline-sm text-headline-sm uppercase tracking-widest">
          BEAUTY HOME CONCEPT <span className="text-primary text-sm ml-2">ADMIN</span>
        </h1>
        <div className="flex items-center gap-6">
          <Link href="/" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors">
            RETOUR AU SITE
          </Link>
        </div>
      </header>
      <nav className="bg-surface-container px-6 py-3 flex gap-8 text-sm font-label-caps tracking-wider border-b border-surface-container-highest overflow-x-auto">
        <Link href="/admin" className="hover:text-primary transition-colors whitespace-nowrap">TABLEAU DE BORD</Link>
        <Link href="/admin/formations" className="hover:text-primary transition-colors whitespace-nowrap">FORMATIONS</Link>
        <Link href="/admin/sessions" className="hover:text-primary transition-colors whitespace-nowrap">SESSIONS</Link>
      </nav>
      <main className="p-6 md:p-12 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
