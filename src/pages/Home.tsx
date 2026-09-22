import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">IEEE PDF → XML Converter (Schema-Adaptive)</h1>
        <p className="mt-2 text-slate-400">
          LLM agent pipeline: analyze template → extract PDF → semantic match → generate XML → validate.
        </p>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          to="/convert"
          className="rounded-xl border border-slate-700 bg-slate-900 p-6 hover:border-cyan-500"
        >
          <h2 className="text-lg font-semibold">Ad-hoc conversion</h2>
          <p className="mt-2 text-sm text-slate-400">Upload PDF + client XML template and run the agent.</p>
        </Link>
        <Link
          to="/convert?mode=client"
          className="rounded-xl border border-slate-700 bg-slate-900 p-6 hover:border-cyan-500"
        >
          <h2 className="text-lg font-semibold">Client-based</h2>
          <p className="mt-2 text-sm text-slate-400">Pick a registered client — PDF only; template is stored.</p>
        </Link>
      </div>
      <div className="flex gap-4 text-sm">
        <Link to="/clients" className="text-cyan-400 hover:underline">Manage clients</Link>
        <Link to="/jobs" className="text-cyan-400 hover:underline">Job history</Link>
      </div>
    </div>
  );
}
