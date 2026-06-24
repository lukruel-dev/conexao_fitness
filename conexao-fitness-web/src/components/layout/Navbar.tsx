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
              <div className="relative w-10 h-10">
                <Image
                  src="/logo_01_tr.png"
                  alt="Conexão Fitness"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-extrabold text-xl leading-5 tracking-tight text-white hidden sm:block">
                Conexão<br/><span className="text-brand-green">Fitness</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
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
