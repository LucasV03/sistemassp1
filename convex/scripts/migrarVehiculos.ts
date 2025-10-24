// convex/scripts/migrarVehiculos.ts
import { internalMutation } from "../_generated/server"; // ✅ ruta correcta
import type { MutationCtx } from "../_generated/server"; // ✅ tipos correctos

/**
 * 🧩 Script de migración de vehículos antiguos
 * Asigna tipoVehiculoId a los documentos que todavía tienen el campo 'tipo' (string).
 */
export const migrarVehiculos = internalMutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const tipos = await ctx.db.query("tipos_vehiculo").collect();
    const vehiculos = await ctx.db.query("vehiculos").collect();

    for (const v of vehiculos) {
      // Si aún no tiene tipoVehiculoId pero sí tiene el viejo campo 'tipo'
      // @ts-ignore  (ignoramos el tipo inexistente temporalmente)
      if (!v.tipoVehiculoId && v.tipo) {
        const match = tipos.find(
          (t: any) =>
            t.nombre.toLowerCase() ===
            // @ts-ignore
            (v.tipo?.toLowerCase?.() || "")
        );

        if (match) {
          await ctx.db.patch(v._id, { tipoVehiculoId: match._id });
          console.log(`✅ ${v.nombre} → ${match.nombre}`);
        } else {
          console.warn(`⚠️ No se encontró tipo para ${v.nombre}`);
        }
      }
    }

    console.log("🚀 Migración completada");
  },
});
