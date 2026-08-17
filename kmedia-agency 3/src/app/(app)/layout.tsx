import Link from "next/link";
import { signOut } from "./actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/proyectos" className="font-semibold text-slate-900">
            Kmedia Agency
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
