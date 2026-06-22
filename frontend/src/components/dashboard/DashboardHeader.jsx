export default function DashboardHeader() {
  return (
    <div className="flex items-end justify-between gap-6 mb-7">
      <div>
        <p className="text-accent uppercase tracking-widest text-xs mb-1">
          Panel
        </p>

        <h1 className="text-3xl md:text-4xl m-0">
          Dashboard
        </h1>
      </div>
    </div>
  );
}