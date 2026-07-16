// components/MFLegend.tsx
import { MF_CLASSES } from "../utils/mfClassification";

export default function MFLegend({
  highlightedCode,
  onHighlight,
}: {
  highlightedCode: number | null;
  onHighlight: (code: number | null) => void;
}) {
  return (
    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
        Forest Management Classification
      </span>
      {MF_CLASSES.map((cls) => (
        <div
          key={cls.code}
          onClick={() => onHighlight(highlightedCode === cls.code ? null : cls.code)}
          className={`flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer text-[11px] ${
            highlightedCode === cls.code ? "bg-slate-800" : "hover:bg-slate-800/50"
          }`}
        >
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-700"
            style={{ backgroundColor: `rgb(${cls.color.join(",")})` }}
          />
          <span className="text-slate-300">{cls.labelEn}</span>
        </div>
      ))}
    </div>
  );
}
