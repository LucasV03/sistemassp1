export const metadata = {
  title: "Proveedores",
};

export default function ProveedoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 space-y-4 text-slate-100">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>

      </header>

      {children}
    </div>
  );
}
