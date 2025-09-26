import { query } from "./_generated/server";
import { v } from "convex/values";

export const listar = query({
  args: {},
  handler: async (ctx) => {
    const pagos = await ctx.db.query("pagos_comprobantes").order("desc").collect();

    return await Promise.all(
      pagos.map(async (p) => {
        const comp = await ctx.db.get(p.comprobanteId);
        let proveedorNombre = "";
        let facturaNumero = "";

        if (comp) {
          const proveedor = await ctx.db.get(comp.proveedorId);
          proveedorNombre = proveedor?.nombre ?? "(sin proveedor)";
          facturaNumero = `${comp.sucursal}-${comp.numero}`;
        }

        return {
          ...p,
          proveedorNombre,
          facturaNumero,
        };
      })
    );
  },
});
