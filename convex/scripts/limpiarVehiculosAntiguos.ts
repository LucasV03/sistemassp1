// convex/scripts/limpiarVehiculosAntiguos.ts
import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";

/**
 * 🧹 Limpia los campos antiguos `slug` y `tipo` en la colección "vehiculos".
 */
export const limpiarVehiculosAntiguos = internalMutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const vehiculos = await ctx.db.query("vehiculos").collect();
    let modificados = 0;

    for (const v of vehiculos) {
      // @ts-ignore — el campo no existe en el schema actual
      if (v.slug !== undefined || v.tipo !== undefined) {
        const { slug, tipo, ...resto } = v as any;
        await ctx.db.replace(v._id, resto);
        modificados++;
        console.log(`🧹 Limpieza aplicada a: ${v.nombre}`);
      }
    }

    console.log(`✅ Limpieza completa (${modificados} documentos actualizados)`);
  },
});
