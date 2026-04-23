import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, CreditCard, Calendar,
  ToggleLeft, ToggleRight, CheckCircle2, AlertCircle,
  FileText, User,
} from 'lucide-react';
import { getTrabajadores, getEmpresas, getDocumentosTrabajador, updateEstado } from '../api';
import type { Trabajador, Empresa, Documento } from '../types';
import { DocumentUploader } from '../components/DocumentUploader';

const TIPOS_DOCUMENTOS = [
  { id: 1, nombre: 'Hoja de vida' },
  { id: 2, nombre: 'Caja de compensación' },
  { id: 3, nombre: 'Contrato laboral' },
  { id: 4, nombre: 'Certificado EPS' },
  { id: 5, nombre: 'Aportes pensión' },
  { id: 6, nombre: 'Certificado ARL' },
  { id: 7, nombre: 'certificado bancario' },
  { id: 8, nombre: 'Fotocopia cédula' },
  { id: 9, nombre: 'Exámenes médicos' },
  { id: 10, nombre: 'Otros' },
];

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const TrabajadorDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const trabajadorId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toggleMsg, setToggleMsg] = useState('');
  const [localEstado, setLocalEstado] = useState<string | null>(null);

  const { data: trabajadores = [], isLoading: loadingTrab } = useQuery({
    queryKey: ['trabajadores'],
    queryFn: () => getTrabajadores().then((r) => r.data as Trabajador[]),
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => getEmpresas().then((r) => r.data as Empresa[]),
  });

  const docQueryKey = ['documentos', trabajadorId];
  const { data: documentos = [], isLoading: loadingDocs } = useQuery({
    queryKey: docQueryKey,
    queryFn: async () => {
      try {
        const r = await getDocumentosTrabajador(trabajadorId);
        const data = r.data;
        // La API puede devolver array directamente o { documentos: [...] }
        if (Array.isArray(data)) return data as Documento[];
        if (data?.documentos) return data.documentos as Documento[];
        return [] as Documento[];
      } catch {
        return [] as Documento[];
      }
    },
    enabled: !!trabajadorId,
  });

  const trabajador = trabajadores.find((t) => t.id === trabajadorId);
  const empresa = empresas.find((e) => e.id === trabajador?.empresa_id);
  const currentEstado = localEstado ?? trabajador?.estado ?? 'activo';

  const estadoMutation = useMutation({
    mutationFn: (nuevoEstado: string) => updateEstado(trabajadorId, nuevoEstado),
    onMutate: (nuevoEstado) => {
      setLocalEstado(nuevoEstado);
      setToggleMsg('');
    },
    onSuccess: (_, nuevoEstado) => {
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
      setToggleMsg(`Estado cambiado a "${nuevoEstado}" ✓`);
      setTimeout(() => setToggleMsg(''), 3000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: unknown; status?: number } };
      console.error('Error toggle estado:', e?.response?.data);
      setLocalEstado(trabajador?.estado ?? null);
      setToggleMsg(`Error: ${JSON.stringify(e?.response?.data) || 'No se pudo cambiar el estado'}`);
      setTimeout(() => setToggleMsg(''), 5000);
    },
  });

  const handleToggleEstado = () => {
    const nuevo = currentEstado === 'activo' ? 'inactivo' : 'activo';
    estadoMutation.mutate(nuevo);
  };

  const docsByTipo: Record<number, Documento> = {};
  documentos.forEach((d) => { docsByTipo[d.tipo_documento_id] = d; });

  const docsCompletos = TIPOS_DOCUMENTOS.filter((t) => docsByTipo[t.id]).length;
  const docsFaltantes = TIPOS_DOCUMENTOS.length - docsCompletos;
  const isLoading = loadingTrab;
  const initials = trabajador?.nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? '?';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver
      </button>

      {isLoading ? <Spinner /> : !trabajador ? (
        <div className="card text-center py-16 text-slate-400">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500">Trabajador no encontrado</p>
        </div>
      ) : (
        <>
          {/* Profile Card */}
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                <span className="text-white font-bold text-2xl">{initials}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-xl font-bold text-slate-800">{trabajador.nombre}</h1>
                  <span className={currentEstado === 'activo' ? 'badge-active' : 'badge-inactive'}>{currentEstado}</span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-slate-400" />CC {trabajador.cedula}</span>
                  <span className="flex items-center gap-1.5"><Building2 size={14} className="text-slate-400" />{empresa?.nombre ?? `Empresa #${trabajador.empresa_id}`}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" />
                    Desde {new Date(trabajador.fecha_creacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Toggle estado */}
              <div className="flex flex-col items-start sm:items-end gap-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</p>
                <button
                  onClick={handleToggleEstado}
                  disabled={estadoMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    currentEstado === 'activo'
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {estadoMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : currentEstado === 'activo' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {currentEstado === 'activo' ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
                </button>
                {toggleMsg && (
                  <p className={`text-xs font-medium flex items-center gap-1 max-w-xs ${toggleMsg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                    {toggleMsg.includes('Error') ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />}
                    {toggleMsg}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                <h2 className="font-bold text-slate-800">Progreso documental</h2>
              </div>
              <span className="text-sm font-bold text-slate-600">{docsCompletos}/{TIPOS_DOCUMENTOS.length}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${docsFaltantes === 0 ? 'bg-green-500' : docsFaltantes <= 3 ? 'bg-amber-400' : 'bg-red-500'}`}
                style={{ width: `${(docsCompletos / TIPOS_DOCUMENTOS.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{docsCompletos} completados</span>
              <span className={docsFaltantes === 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                {loadingDocs ? 'Cargando...' : docsFaltantes === 0 ? '¡Al día!' : `${docsFaltantes} faltantes`}
              </span>
            </div>
          </div>

          {/* Documents */}
          <div className="mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <h2 className="text-lg font-bold text-slate-800">Documentos requeridos</h2>
          </div>

          {loadingDocs ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIPOS_DOCUMENTOS.map((tipo) => (
                <DocumentUploader
                  key={tipo.id}
                  tipoDocumentoId={tipo.id}
                  nombre={tipo.nombre}
                  trabajadorId={trabajadorId}
                  documento={docsByTipo[tipo.id]}
                  queryKey={docQueryKey}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
