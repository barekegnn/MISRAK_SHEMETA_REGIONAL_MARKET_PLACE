export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center bg-gradient-to-b from-brand-50/50 to-white px-4 py-12">
      {children}
    </div>
  );
}
