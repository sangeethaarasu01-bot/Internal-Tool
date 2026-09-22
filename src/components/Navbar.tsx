import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold text-cyan-400">
          ieee-xml-converter
        </Link>
        <nav className="flex gap-4 text-sm text-slate-300">
          <Link to="/convert">Convert</Link>
          <Link to="/jobs">Jobs</Link>
          <Link to="/clients">Clients</Link>
        </nav>
      </div>
    </header>
  );
}
