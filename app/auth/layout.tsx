export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-nude-100 to-nude-200 flex flex-col justify-center px-6 py-12">
      {children}
    </div>
  );
}
