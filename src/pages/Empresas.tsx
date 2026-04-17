import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, ChevronRight, Plus } from 'lucide-react';
import { getEmpresas } from '../api';
import type { Empresa } from '../types';
import { ModalCrearEmpresa } from '../components/ModalCrearEmpresa';

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const Empresas = () => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const { data: empresas = [], isLoading, error } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => getEmpresas().then((r) => r.data as Empresa[]),
  });

  const filtered = empresas.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {showModal && <ModalCrearEmpresa onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Empresas</h1>
          <p className="text-slate-500 text-sm mt-1">{empresas.length} empresa(s) registradas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Nueva empresa
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa por nombre..." className="input pl-10" />
      </div>

      {isLoading ? <Spinner /> : error ? (
        <div className="card text-center py-10 text-red-500"><p className="text-sm font-medium">Error al cargar empresas. Intente de nuevo.</p></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500">No se encontraron empresas</p>
          <p className="text-sm mt-1">Intenta con otro término o crea una nueva</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4">
            <Plus size={15} /> Crear empresa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((empresa) => (
            <div key={empresa.id} onClick={() => navigate(`/empresa/${empresa.id}`)}
              className="card cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <Building2 size={22} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 truncate">{empresa.nombre}</h3>
              <p className="text-xs text-slate-400 mb-3">ID #{empresa.id}</p>
              <div className="flex items-center justify-between">
                <span className={empresa.estado === 'activo' ? 'badge-active' : 'badge-inactive'}>{empresa.estado}</span>
                <span className="text-xs text-slate-400">
                  {new Date(empresa.fecha_creacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1 text-blue-500 text-xs font-semibold group-hover:gap-2 transition-all">
                Ver trabajadores <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
