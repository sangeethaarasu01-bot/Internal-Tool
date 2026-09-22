import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import SchemaMapViewer from "../components/SchemaMapViewer";
import { getSchemaForClient } from "../lib/api";

export default function SchemaViewer() {
  const { clientId = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["schema", clientId],
    queryFn: () => getSchemaForClient(clientId),
  });

  if (isLoading) return <p>Loading schema…</p>;
  if (error) return <p className="text-red-400">Schema not available. Run reanalyze on client.</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Schema: {data?.root_tag}</h1>
      <p className="mb-4 text-sm text-slate-400">
        {data?.elements.length} elements · model {data?.llm_model}
      </p>
      {data && <SchemaMapViewer elements={data.elements} />}
    </div>
  );
}
