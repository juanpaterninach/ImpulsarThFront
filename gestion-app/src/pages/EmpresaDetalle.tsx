import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmpresas, getTrabajadores, getFaltantes } from '../api';
import type { Empresa, Trabajador } from '../types';
import { ArrowLeft, Building2, Users, ChevronRight, AlertTriangle, Plus } from 'lucide-react';
import { ModalCrearTrabajador } from '../components/ModalCrearTrabajador';

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const EmpresaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const empresaId = Number(id);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const { data: empresas = [], isLoading: loadingEmpresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => getEmpresas().then((r) => r.data as Empresa[]),
  });
  const empresa = empresas.find((e) => e.id === empresaId);

  const { data: todosTrabajadores = [], isLoading: loadingTrab } = useQuery({
    queryKey: ['trabajadores'],
    queryFn: () => getTrabajadores().then((r) => r.data as Trabajador[]),
  });
  const trabajadores = todosTrabajadores.filter((t) => t.empresa_id === empresaId);
  const ids = trabajadores.map((t) => t.id);

  const { data: faltantesMap = {} } = useQuery({
    queryKey: ['faltantes-empresa', ids],
    queryFn: async () => {
      const results = await Promise.allSettled(
        ids.map((id) => getFaltantes(id).then((r) => ({ id, count: r.data?.faltantes?.length ?? 0 })).catch(() => ({ id, count: 10 })))
      );
      const map: Record<number, number> = {};
      results.forEach((r) => { if (r.status === 'fulfilled') map[r.value.id] = r.value.count; });
      return map;
    },
    enabled: ids.length > 0,
  });

  const isLoading = loadingEmpresas || loadingTrab;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {showModal && <ModalCrearTrabajador onClose={() => setShowModal(false)} defaultEmpresaId={empresaId} />}

      <button onClick={() => navigate('/empresas')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a Empresas
      </button>

      {isLoading ? <Spinner /> : (
        <>
          <div className="card mb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                <Building2 size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-800">{empresa?.nombre ?? `Empresa #${empresaId}`}</h1>
                  <span className={empresa?.estado === 'activo' ? 'badge-active' : 'badge-inactive'}>{empresa?.estado ?? '–'}</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Registrada el {empresa?.fecha_creacion ? new Date(empresa.fecha_creacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '–'}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
                <Users size={16} className="text-blue-500" />
                <span className="text-sm font-bold text-blue-600">{trabajadores.length} trabajadores</span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full" />
              <h2 className="text-lg font-bold text-slate-800">Trabajadores</h2>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={15} /> Nuevo trabajador
            </button>
          </div>

          {trabajadores.length === 0 ? (
            <div className="card text-center py-16 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-slate-500">Esta empresa no tiene trabajadores registrados</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4">
                <Plus size={15} /> Agregar trabajador
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trabajadores.map((t) => {
                const faltantes = faltantesMap[t.id] ?? 10;
                const initials = t.nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
                return (
                  <div key={t.id} onClick={() => navigate(`/trabajador/${t.id}`)}
                    className="card cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200">
                        <span className="text-white font-bold text-xs">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{t.nombre}</h3>
                        <p className="text-xs text-slate-400">CC {t.cedula}</p>
                      </div>
                      {faltantes > 0 && <span className="badge-missing">{faltantes}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={t.estado === 'activo' ? 'badge-active' : 'badge-inactive'}>{t.estado}</span>
                      {faltantes > 0 && <span className="text-xs text-red-500 font-semibold flex items-center gap-1"><AlertTriangle size={11} />{faltantes}</span>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1 text-blue-500 text-xs font-semibold group-hover:gap-2 transition-all">
                      Ver perfil <ChevronRight size={12} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
