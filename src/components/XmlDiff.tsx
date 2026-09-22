import ReactDiffViewer from "react-diff-viewer-continued";

export default function XmlDiff({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  return (
    <div className="overflow-auto rounded border border-slate-800 text-xs">
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView
        useDarkTheme
        hideLineNumbers={false}
      />
    </div>
  );
}
