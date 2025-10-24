import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const seedViajes = mutation({
  args: {},
  handler: async ({ db }) => {
    // 1️⃣ Buscar datos base desde Convex
    const clientes = await db.query("clientes_ventas").collect();
    const choferes = await db.query("choferes").collect();
    const vehiculos = await db.query("vehiculos").collect();

    if (clientes.length === 0 || choferes.length === 0 || vehiculos.length === 0) {
      throw new Error("Faltan datos base: asegúrate de tener clientes, choferes y vehículos cargados.");
    }

    // 2️⃣ Tabla local de distancias (puede pasarse a BD luego)
    const DISTANCIAS_PREDEFINIDAS: Record<string, Record<string, number>> = {
      "Base Central": { "Mina Sur": 120, "Mina Norte": 95, "Taller": 30 },
      "Mina Sur": { "Base Central": 120, "Taller": 150 },
      "Mina Norte": { "Base Central": 95, "Taller": 110 },
      "Taller": { "Base Central": 30, "Mina Sur": 150, "Mina Norte": 110 },
    };

    const ubicaciones = Object.keys(DISTANCIAS_PREDEFINIDAS);

    // 3️⃣ Crear 15 viajes combinando registros existentes
    const viajes = Array.from({ length: 15 }).map(() => {
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      const chofer = choferes[Math.floor(Math.random() * choferes.length)];
      const vehiculo = vehiculos[Math.floor(Math.random() * vehiculos.length)];

      // Seleccionar origen y destino distintos
      let origen = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
      let destino = origen;
      while (destino === origen) {
        destino = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
      }

      const distancia =
        DISTANCIAS_PREDEFINIDAS[origen]?.[destino] ??
        DISTANCIAS_PREDEFINIDAS[destino]?.[origen] ??
        Math.floor(Math.random() * 200 + 50); // fallback aleatorio

      const estados = ["PENDIENTE", "EN_CURSO", "FINALIZADO", "CANCELADO"] as const;
      const estado = estados[Math.floor(Math.random() * estados.length)];

      return {
        clienteId: cliente._id as Id<"clientes_ventas">,
        choferId: chofer._id as Id<"choferes">,
        vehiculoId: vehiculo._id as Id<"vehiculos">,
        origen,
        destino,
        distanciaKm: distancia,
        estado,
        creadoEn: Date.now(),
        actualizadoEn: Date.now(),
      };
    });

    // 4️⃣ Insertar todos
    for (const v of viajes) {
      await db.insert("viajes", v);
    }

    return `${viajes.length} viajes insertados correctamente`;
  },
});


export const seedClientesVentas = mutation(async ({ db }) => {
  const clientes = [
    {
      alias: "Minera Los Andes",
      razonSocial: "Minera Los Andes S.A.",
      cuit: "30-71562985-2",
      direccion: "Ruta 40 km 233, San Juan",
      telefono: "2645123456",
      email: "contacto@mineralosandes.com",
      provincia: "San Juan",
      ciudad: "Iglesia",
      codigoPostal: "5465",
      estado: "ACTIVO" as const,
    },
    {
      alias: "Transminera Sur",
      razonSocial: "Transportes Mineros del Sur SRL",
      cuit: "30-90435627-3",
      direccion: "Av. Belgrano 1250, Catamarca",
      telefono: "3834456789",
      email: "info@transmineralsur.com",
      provincia: "Catamarca",
      ciudad: "Andalgalá",
      codigoPostal: "4740",
      estado: "ACTIVO" as const,
    },
    {
      alias: "YPF Industrial",
      razonSocial: "YPF S.A. División Industrial",
      cuit: "30-54678923-9",
      direccion: "Av. Libertador 6543, CABA",
      telefono: "1123456789",
      email: "ventas@ypfindustrial.com.ar",
      provincia: "Buenos Aires",
      ciudad: "CABA",
      codigoPostal: "1425",
      estado: "ACTIVO" as const,
    },
    {
      alias: "Metales del Norte",
      razonSocial: "Metales del Norte SRL",
      cuit: "30-98765432-1",
      direccion: "Ruta Prov. 5 km 22, Salta",
      telefono: "3875234567",
      email: "administracion@metalesnorte.com",
      provincia: "Salta",
      ciudad: "General Güemes",
      codigoPostal: "4430",
      estado: "ACTIVO" as const,
    },
    {
      alias: "Petromina",
      razonSocial: "Petromina S.A.",
      cuit: "30-90234561-0",
      direccion: "Camino Minero 2500, Jujuy",
      telefono: "3884567890",
      email: "contacto@petromina.com",
      provincia: "Jujuy",
      ciudad: "Abra Pampa",
      codigoPostal: "4640",
      estado: "INACTIVO" as const,
    },
  ];

  for (const c of clientes) {
    await db.insert("clientes_ventas", {
      ...c,
      creadoPor: "seed-script",
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
    });
  }

  return `${clientes.length} clientes de ventas insertados correctamente`;
});
