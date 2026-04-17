import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, RefreshCw, ExternalLink, FileText, AlertCircle, X } from 'lucide-react';
import { uploadDocumento } from '../api';
import type { Documento } from '../types';
 
interface Props {
  tipoDocumentoId: number;
  nombre: string;
  trabajadorId: number;
  documento?: Documento;
  queryKey: unknown[];
}
 
export const DocumentUploader = ({ tipoDocumentoId, nombre, trabajadorId, documento, queryKey }: Props) => {
  const [replacing, setReplacing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
 
  const hasDoc = !!documento && !replacing;
 
  const mutation = useMutation({
    mutationFn: (file: File) => uploadDocumento(file, trabajadorId, tipoDocumentoId),
    onSuccess: () => {
      // Invalida documentos del trabajador
      queryClient.invalidateQueries({ queryKey });
      // Invalida faltantes para que el dashboard se actualice
      queryClient.invalidateQueries({ queryKey: ['faltantes-all'] });
      queryClient.invalidateQueries({ queryKey: ['faltantes-empresa'] });
      setReplacing(false);
      setSuccessMsg('Documento subido correctamente');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(axiosErr?.response?.data?.detail || 'Error al subir el archivo');
      setTimeout(() => setErrorMsg(''), 4000);
    },
  });
 
  const handleFile = (file: File) => { setErrorMsg(''); mutation.mutate(file); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
 
  if (hasDoc) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">{nombre}</p>
            <p className="text-xs text-green-600 mt-0.5">Documento cargado</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={documento.url_archivo} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-900 bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors">
              <ExternalLink size={11} /> Ver
            </a>
            <button onClick={() => setReplacing(true)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors">
              <RefreshCw size={11} /> Reemplazar
            </button>
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <div className={`rounded-xl border-2 border-dashed transition-all duration-200 ${dragOver ? 'border-blue-400 bg-blue-50' : replacing ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${replacing ? 'bg-amber-400' : 'bg-red-500'}`}>
            <FileText size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${replacing ? 'text-amber-800' : 'text-red-800'}`}>{nombre}</p>
            <p className={`text-xs ${replacing ? 'text-amber-600' : 'text-red-500'}`}>{replacing ? 'Reemplazando documento' : 'Documento faltante'}</p>
          </div>
          {replacing && <button onClick={() => setReplacing(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>}
        </div>
 
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !mutation.isPending && inputRef.current?.click()}
          className={`border border-dashed rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-all ${dragOver ? 'border-blue-400 bg-blue-50/80' : replacing ? 'border-amber-300 bg-amber-50/80 hover:bg-amber-100/50' : 'border-red-200 bg-red-50/80 hover:bg-red-100/50'} ${mutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {mutation.isPending ? (
            <><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" /><span className="text-xs text-slate-500 font-medium">Subiendo archivo...</span></>
          ) : (
            <><Upload size={16} className="text-slate-400 flex-shrink-0" /><span className="text-xs text-slate-500"><span className="font-semibold text-blue-600">Haz clic</span> o arrastra el archivo aquí</span></>
          )}
        </div>
 
        <input ref={inputRef} type="file" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
 
        {successMsg && <p className="mt-2 text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> {successMsg}</p>}
        {errorMsg && <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {errorMsg}</p>}
      </div>
    </div>
  );
};
