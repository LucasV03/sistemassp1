'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe,
  Home,
  Wrench,
  Clock,
  Box,
  Users2Icon,
  FileText,
  Receipt,
  User2Icon,
  ChevronDown,
  ChevronRight,
  Menu,
  Truck,
  Briefcase,
  DollarSign,
} from 'lucide-react';

// 🔹 Tipos
type MenuItemProps = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  hasSubmenu?: boolean;
  isOpen?: boolean;
};

type SubMenuItemProps = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  isActive?: boolean;
};

// 🔹 Item de menú principal
const MenuItem = ({ icon: Icon, label, isActive, onClick, hasSubmenu, isOpen }: MenuItemProps) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${
      isActive ? 'bg-teal-700 text-white' : 'text-teal-100 hover:bg-teal-700/50'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {hasSubmenu && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
  </div>
);

// 🔹 Submenu item
const SubMenuItem = ({ href, label, icon: Icon, isActive }: SubMenuItemProps) => (
  <Link
    href={href}
    className={`flex items-center gap-3 pl-12 pr-4 py-2 text-sm transition-all ${
      isActive ? 'text-white bg-teal-700/30' : 'text-teal-200 hover:text-white hover:bg-teal-700/30'
    }`}
  >
    <Icon size={16} />
    {label}
  </Link>
);

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<{ compras: boolean; ventas: boolean }>({
    compras: true,
    ventas: true,
  });

  const toggleMenu = (menu: keyof typeof openMenus) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <div className="w-64 bg-gradient-to-b from-teal-600 to-teal-700 flex flex-col text-white overflow-y-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-teal-500/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Globe className="text-teal-600" size={20} />
          </div>
          <span className="text-xl font-semibold">Transporte Emanuel</span>
        </div>
        <Menu size={20} className="cursor-pointer" />
      </div>

      {/* Menús */}
      <div className="flex-1 py-4">
        {/* Compras / Stock */}
        <div className="px-4 mb-2">
          <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
            Compras & Stock
          </span>
        </div>
        <MenuItem
          icon={Home}
          label="Compras / Stock"
          hasSubmenu
          isOpen={openMenus.compras}
          onClick={() => toggleMenu('compras')}
        />
        {openMenus.compras && (
          <>
            <SubMenuItem href="/" label="Inicio" icon={Home} isActive={pathname === '/'} />
            <SubMenuItem
              href="/repuestos"
              label="Repuestos"
              icon={Wrench}
              isActive={pathname.startsWith('/repuestos')}
            />
            <SubMenuItem
              href="/movimientos"
              label="Movimientos"
              icon={Clock}
              isActive={pathname.startsWith('/movimientos')}
            />
            <SubMenuItem
              href="/depositos"
              label="Depósitos"
              icon={Box}
              isActive={pathname.startsWith('/depositos')}
            />
            <SubMenuItem
              href="/proveedores"
              label="Proveedores"
              icon={Users2Icon}
              isActive={pathname.startsWith('/proveedores')}
            />
            <SubMenuItem
              href="/ordenes-compra"
              label="Órdenes de Compra"
              icon={FileText}
              isActive={pathname.startsWith('/ordenes-compra')}
            />
            <SubMenuItem
              href="/facturas"
              label="Facturas Proveedores"
              icon={Receipt}
              isActive={pathname.startsWith('/facturas')}
            />
          </>
        )}

        {/* Ventas */}
        <div className="px-4 mt-6 mb-2">
          <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
            Ventas
          </span>
        </div>
        <MenuItem
          icon={DollarSign}
          label="Ventas"
          hasSubmenu
          isOpen={openMenus.ventas}
          onClick={() => toggleMenu('ventas')}
        />
        {openMenus.ventas && (
          <>
            <SubMenuItem
              href="/clientes"
              label="Clientes"
              icon={User2Icon}
              isActive={pathname.startsWith('/clientes')}
            />
            <SubMenuItem
              href="/contratos-servicios"
              label="Contratos"
              icon={Briefcase}
              isActive={pathname.startsWith('/contratos-servicios')}
            />
            <SubMenuItem
              href="/viajes"
              label="Viajes"
              icon={Truck}
              isActive={pathname.startsWith('/viajes')}
            />
            <SubMenuItem
              href="/ventas"
              label="Facturación"
              icon={Receipt}
              isActive={pathname.startsWith('/ventas')}
            />
          </>
        )}
      </div>

      {/* User Footer */}
     
    
    </div>
  );
}
