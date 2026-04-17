import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ChevronRight, Plus } from 'lucide-react';
import { getTrabajadores, getEmpresas } from '../api';
import type { Trabajador, Empresa } from '../types';
import { ModalCrearTrabajador } from '../components/ModalCrearTrabajador';

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const Trabajadores = () => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const { data: trabajadores = [], isLoading, error } = useQuery({
    queryKey: ['trabajadores'],
    queryFn: () => getTrabajadores().then((r) => r.data as Trabajador[]),
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => getEmpresas().then((r) => r.data as Empresa[]),
  });

  const empresaMap: Record<number, string> = {};
  empresas.forEach((e) => { empresaMap[e.id] = e.nombre; });

  const filtered = trabajadores.filter((t) =>
    t.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {showModal && <ModalCrearTrabajador onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Trabajadores</h1>
          <p className="text-slate-500 text-sm mt-1">{trabajadores.length} trabajador(es) registrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Nuevo trabajador
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-center">
          <p className="text-xl font-bold text-blue-600">{trabajadores.length}</p>
          <p className="text-xs text-blue-500 font-medium">Total</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-center">
          <p className="text-xl font-bold text-green-600">{trabajadores.filter((t) => t.estado === 'activo').length}</p>
          <p className="text-xs text-green-500 font-medium">Activos</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-center">
          <p className="text-xl font-bold text-amber-600">{trabajadores.filter((t) => t.estado !== 'activo').length}</p>
          <p className="text-xs text-amber-500 font-medium">Inactivos</p>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar trabajador por nombre..." className="input pl-10" />
      </div>

      {isLoading ? <Spinner /> : error ? (
        <div className="card text-center py-10 text-red-500"><p className="text-sm font-medium">Error al cargar trabajadores.</p></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500">No se encontraron trabajadores</p>
          <p className="text-sm mt-1">Intenta con otro término o crea uno nuevo</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4">
            <Plus size={15} /> Crear trabajador
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t) => {
            const initials = t.nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
            return (
              <div key={t.id} onClick={() => navigate(`/trabajador/${t.id}`)}
                className="card cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
                    <span className="text-white font-bold text-sm">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{t.nombre}</h3>
                    <p className="text-xs text-slate-400">CC {t.cedula}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-slate-400 mb-0.5">Empresa</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{empresaMap[t.empresa_id] ?? `ID ${t.empresa_id}`}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className={t.estado === 'activo' ? 'badge-active' : 'badge-inactive'}>{t.estado}</span>
                  <span className="text-xs text-slate-400">#{t.id}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1 text-blue-500 text-xs font-semibold group-hover:gap-2 transition-all">
                  Ver perfil <ChevronRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
