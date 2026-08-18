import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/finex_icon_hd.svg"
                  alt="Finex"
                  fill
                  className="object-contain drop-shadow-[0_0_10px_rgba(0,166,255,0.35)]"
                  priority
                />
              </div>
              <div className="relative h-9 w-32 hidden sm:block">
                <Image
                  src="/finex_text_hd.svg"
                  alt="Finex Fitness"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/quem-somos" className="text-sm font-semibold text-brand-green hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/30">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              Quem somos
            </Link>
            <Link href="/#como-funciona" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Como<br/>Funciona
            </Link>
            <Link href="/#para-alunos" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Para<br/>Alunos
            </Link>
            <Link href="/#para-profissionais" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Para<br/>Profissionais
            </Link>
            <Link href="/planos" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Planos
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <Link href="/login" className="hidden sm:flex text-sm font-bold text-white hover:text-slate-300 transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="bg-[#14b8a6] hover:bg-[#0d9488] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-teal-500/20">
              Cadastre-se
            </Link>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-slate-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
