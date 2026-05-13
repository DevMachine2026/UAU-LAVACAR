export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-uau-black">{title}</h2>
      {children}
    </section>
  );
}
