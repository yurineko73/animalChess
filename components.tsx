import React from "react";

export const ProgressBar = ({ value, max, color, label }: { value: number, max: number, color: string, label?: string }) => (
  <div className="flex flex-col w-full">
    {label && <div className="text-[10px] font-bold text-slate-600 mb-1 flex justify-between"><span>{label}</span><span className="font-black">{value}/{max}</span></div>}
    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300 shadow-inner">
      <div className={`h-full ${color} transition-all duration-500 ease-out rounded-full`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }}></div>
    </div>
  </div>
);

export const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-xl text-slate-800">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-xl">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      <button onClick={onClose} className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">Close</button>
    </div>
  </div>
);
