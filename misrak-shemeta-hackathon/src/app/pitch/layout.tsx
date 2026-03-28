export default function PitchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0d2e] text-white">{children}</div>
  );
}
