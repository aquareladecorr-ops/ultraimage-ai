import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-bone flex flex-col">
      <header className="px-6 md:px-10 py-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-7 h-7 relative">
            <div className="absolute inset-0 rounded-sm border border-copper rotate-45" />
            <div className="absolute inset-1 bg-copper rotate-45" />
          </div>
          <span className="font-display tracking-tight" style={{ fontWeight: 500, fontSize: "18px" }}>
            ultraimage<span className="text-copper">.</span>ai
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
