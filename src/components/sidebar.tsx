'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Home, ArrowLeftRight, Car, Route, User, User2Icon, Users2Icon, Wrench, Paperclip, UserCheck2, Clock, Box } from 'lucide-react';

const links = [
  { href: '/',          label: 'Home',        Icon: Home },
  
  { href: '/vehiculos', label: 'Vehículos',   Icon: Car },
  { href: '/viajes',    label: 'Viajes',      Icon: Route },
  { href: '/repuestos', label: 'Repuestos',   Icon: Wrench },
  
  
  { href: '/movimientos',  label: 'Movimientos',    Icon: Clock },
  { href: '/depositos',   label: 'Depositos',     Icon: Box },
  { href: '/traspasos',   label: 'Traspasos',     Icon: ArrowLeftRight },
  { href: '/reportes',  label: 'Reportes',    Icon: Paperclip },
  { href: '/proveedores', label: 'Proveedores', Icon: Users2Icon },
  { href: '/clientes',  label: 'Clientes',    Icon: UserCheck2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-[#1a1a1a]">
      {/* Logo */}
      <div className="flex items-center gap-3 text-white text-xl font-bold tracking-wide border-b border-gray-800 px-6 py-5.5">
        <Globe className="h-6 w-6 text-violet-500" />
        Transportes Emanuel
      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-2 mt-8">
        {links.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "relative flex flex-col items-center justify-center py-4 text-sm transition-colors",
                active
                  ? "bg-[#141414] text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#1f1f1f]"
              ].join(" ")}
            >
              {/* Línea morada en el lado izquierdo del activo */}
              {active && (
                <span className="absolute left-0 top-0 h-full w-1 bg-violet-500"></span>
              )}

              {/* Icono más grande */}
              <Icon className="h-10 w-10 mb-1" />  
              {/* Texto debajo */}
              <span className="text-base">{label}</span>  
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
