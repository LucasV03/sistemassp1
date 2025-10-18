import { query } from "./_generated/server";
import { v } from "convex/values";

/* ========================================================
   📄 LISTAR PAGOS (muestra proveedor, medio, importe, facturas)
   ======================================================== */
export const listar = query({
  args: {},
  handler: async (ctx) => {
    const pagos = await ctx.db.query("pagos_comprobantes").order("desc").collect();

    // Enriquecemos cada pago con datos del proveedor y las facturas
    return await Promise.all(
      pagos.map(async (p) => {
        const proveedor = await ctx.db.get(p.proveedorId);
        const facturas = await Promise.all(
          (p.facturasIds ?? []).map((id) => ctx.db.get(id))
        );

        const proveedorNombre = proveedor?.nombre ?? "(sin proveedor)";
        const facturasNumeros = facturas
          .filter(Boolean)
          .map((f) => `${f!.sucursal}-${f!.numero}`)
          .join(", ");

        return {
          ...p,
          proveedorNombre,
          facturasNumeros,
        };
      })
    );
  },
});

/* ========================================================
   📄 LISTAR PAGOS POR FACTURA ESPECÍFICA
   ======================================================== */
export const listarPorFactura = query({
  args: { facturaId: v.id("comprobantes_prov") },
  handler: async (ctx, { facturaId }) => {
    // Buscar todos los pagos que incluyan esta factura dentro del array facturasIds
    const todos = await ctx.db.query("pagos_comprobantes").collect();
    return todos.filter((p) => p.facturasIds?.includes(facturaId));
  },
});

export const obtener = query({
  args: { id: v.id("pagos_comprobantes") },
  handler: async (ctx, { id }) => {
    const pago = await ctx.db.get(id);
    if (!pago) throw new Error("Pago no encontrado");

    // 🧾 Traer proveedor asociado
    const proveedor = await ctx.db.get(pago.proveedorId);

    // 🧩 Traer facturas asociadas
    let facturas: any[] = [];
    if (pago.facturasIds && pago.facturasIds.length > 0) {
      const fetched = await Promise.all(
        pago.facturasIds.map((fid) => ctx.db.get(fid))
      );
      facturas = fetched.filter(Boolean);
    }

    // ✅ Devolvemos campos adicionales para el frontend
    return {
      ...pago,
      proveedorNombre: proveedor?.nombre ?? "(sin proveedor)",
      facturas,
    };
  },
});