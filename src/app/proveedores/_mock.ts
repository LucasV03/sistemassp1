// src/app/proveedores/_mock.ts
export type Proveedor = {
  id: string;
  nombre: string;
  contacto_principal: string;
  telefono: string;
  email: string;
  direccion: string;
  activo: boolean;
  reputacion?: number; // 1-5
  productos_ofrecidos: string[]; // por ahora strings
  notas?: string;
};

export const proveedoresMock: Proveedor[] = [
  {
    id: "prov-1",
    nombre: "Repuestar SRL",
    contacto_principal: "Ana López",
    telefono: "381-555-1234",
    email: "ventas@repuestar.com",
    direccion: "Av. Industrial 123",
    activo: true,
    reputacion: 5,
    productos_ofrecidos: ["Pastillas freno", "Aceite 10W40", "Baterías 75Ah"],
    notas: "Entrega en 24h a depósitos de la zona.",
  },
  {
    id: "prov-2",
    nombre: "TransPartes SA",
    contacto_principal: "Carlos Pérez",
    telefono: "381-555-5678",
    email: "cperez@transpartes.com",
    direccion: "Ruta 9 Km 12",
    activo: false,
    reputacion: 3,
    productos_ofrecidos: ["Filtros aire", "Correas", "Bujías"],
  },
  {
    id: "prov-3",
    nombre: "LogiParts",
    contacto_principal: "María Vera",
    telefono: "381-555-9012",
    email: "mvera@logiparts.com",
    direccion: "Parque Logístico Módulo 4",
    activo: true,
    reputacion: 4,
    productos_ofrecidos: ["Amortiguadores", "Radiadores"],
    notas: "Tiene convenio de precios por volumen.",
  },
];
