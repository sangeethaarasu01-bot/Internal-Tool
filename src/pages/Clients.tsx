import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { createClient, listClients, reanalyzeClient } from "../lib/api";

export default function Clients() {
  const qc = useQueryClient();
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const onCreate = async () => {
    if (!file || !name || !slug) {
      toast.error("Name, slug, and template required");
      return;
    }
    await createClient(name, slug, file);
    toast.success("Client created");
    qc.invalidateQueries({ queryKey: ["clients"] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clients</h1>
      <div className="rounded border border-slate-800 p-4">
        <h2 className="font-medium">Add client</h2>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input
            placeholder="Name"
            className="rounded border border-slate-700 bg-slate-900 p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="slug"
            className="rounded border border-slate-700 bg-slate-900 p-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <input type="file" accept=".xml" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <button onClick={onCreate} className="mt-3 rounded bg-cyan-600 px-4 py-2 text-sm">
          Save
        </button>
      </div>
      <ul className="space-y-2">
        {clients.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded border border-slate-800 p-3">
            <div>
              <Link to={`/schema/${c.id}`} className="font-medium text-cyan-400">{c.name}</Link>
              <p className="text-xs text-slate-500">{c.slug}</p>
            </div>
            <button
              className="text-xs text-slate-400 hover:text-white"
              onClick={async () => {
                await reanalyzeClient(c.id);
                toast.success("Re-analyzed");
              }}
            >
              Reanalyze schema
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
