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
      {children}
    </div>
  );
}
