import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import type { Empresa, Trabajador } from '../types';
import { getEmpresas, getTrabajadores, getFaltantes } from '../api';
import {
  Building2, Users, FileWarning, ChevronRight,
  TrendingDown, AlertTriangle, RefreshCw,
} from 'lucide-react';

// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/navigation';
// @ts-ignore
import 'swiper/css/pagination';

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

const EmpresaCard = ({ empresa, faltantes }: { empresa: Empresa; faltantes: number }) => {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/empresa/${empresa.id}`)}
      className="card cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 select-none h-full">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Building2 size={18} className="text-blue-600" />
        </div>
        {faltantes > 0 && <span className="badge-missing">{faltantes}</span>}
      </div>
      <h3 className="font-bold text-slate-800 text-sm mb-1 truncate">{empresa.nombre}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className={empresa.estado === 'activo' ? 'badge-active' : 'badge-inactive'}>{empresa.estado}</span>
        <span className="text-xs text-slate-400 flex items-center gap-1"><FileWarning size={12} />{faltantes} faltantes</span>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1 text-blue-500 text-xs font-semibold">
        Ver detalle <ChevronRight size={12} />
      </div>
    </div>
  );
};

const TrabajadorCard = ({ trabajador, faltantes }: { trabajador: Trabajador; faltantes: number }) => {
  const navigate = useNavigate();
  const initials = trabajador.nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  return (
    <div onClick={() => navigate(`/trabajador/${trabajador.id}`)}
      className="card cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 select-none h-full">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200">
          <span className="text-white font-bold text-xs">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-sm truncate">{trabajador.nombre}</h3>
          <p className="text-xs text-slate-400">CC {trabajador.cedula}</p>
        </div>
        {faltantes > 0 && <span className="badge-missing">{faltantes}</span>}
      </div>
      <div className="flex items-center justify-between">
        <span className={trabajador.estado === 'activo' ? 'badge-active' : 'badge-inactive'}>{trabajador.estado}</span>
        {faltantes > 0 && (
          <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
            <AlertTriangle size={11} />{faltantes} faltantes
          </span>
        )}
        {faltantes === 0 && (
          <span className="text-xs text-green-600 font-semibold">✓ Al día</span>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1 text-blue-500 text-xs font-semibold">
        Ver perfil <ChevronRight size={12} />
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const queryClient = useQueryClient();

  const { data: empresasData, isLoading: loadingEmpresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => getEmpresas().then((r) => r.data as Empresa[]),
    staleTime: 0,
  });

  const { data: trabajadoresData, isLoading: loadingTrabajadores } = useQuery({
    queryKey: ['trabajadores'],
    queryFn: () => getTrabajadores().then((r) => r.data as Trabajador[]),
    staleTime: 0,
  });

  const trabajadoresIds = trabajadoresData?.map((t) => t.id) ?? [];

  const { data: faltantesMap = {}, isLoading: loadingFaltantes, refetch: refetchFaltantes } = useQuery({
    queryKey: ['faltantes-all', trabajadoresIds.join(',')],
    queryFn: async () => {
      const map: Record<number, number> = {};
      await Promise.allSettled(
        trabajadoresIds.map(async (id) => {
          try {
            const r = await getFaltantes(id);
            // La API devuelve { faltantes: [...] } — contamos los elementos
            const lista = r.data?.faltantes ?? r.data ?? [];
            map[id] = Array.isArray(lista) ? lista.length : 0;
          } catch {
            map[id] = 0;
          }
        })
      );
      return map;
    },
    enabled: trabajadoresIds.length > 0,
    staleTime: 0,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['faltantes-all'] });
    refetchFaltantes();
  };

  // Trabajadores ordenados por faltantes desc
  const trabajadoresSorted = [...(trabajadoresData ?? [])]
    .sort((a, b) => (faltantesMap[b.id] ?? 0) - (faltantesMap[a.id] ?? 0));

  // Faltantes por empresa (suma de sus trabajadores)
  const empresasFaltantes: Record<number, number> = {};
  (trabajadoresData ?? []).forEach((t) => {
    empresasFaltantes[t.empresa_id] =
      (empresasFaltantes[t.empresa_id] ?? 0) + (faltantesMap[t.id] ?? 0);
  });

  const empresasSorted = [...(empresasData ?? [])]
    .sort((a, b) => (empresasFaltantes[b.id] ?? 0) - (empresasFaltantes[a.id] ?? 0));

  const totalConFaltantes = trabajadoresSorted.filter((t) => (faltantesMap[t.id] ?? 0) > 0).length;
  const empresasConAlertas = empresasSorted.filter((e) => (empresasFaltantes[e.id] ?? 0) > 0).length;

  const isLoadingAll = loadingEmpresas || loadingTrabajadores || loadingFaltantes;

  const swiperConfig = {
    modules: [Navigation, Pagination, A11y],
    spaceBetween: 16,
    navigation: true,
    pagination: { clickable: true },
    breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 }, 1280: { slidesPerView: 4 } },
    slidesPerView: 1,
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Resumen general del sistema de gestión</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3 py-2 rounded-xl transition-all hover:border-blue-300"
          title="Actualizar datos"
        >
          <RefreshCw size={15} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Empresas registradas" value={empresasData?.length ?? 0} icon={Building2} color="bg-blue-500" />
        <StatCard label="Trabajadores activos" value={trabajadoresData?.filter((t) => t.estado === 'activo').length ?? 0} icon={Users} color="bg-emerald-500" />
        <StatCard label="Con docs faltantes" value={totalConFaltantes} icon={FileWarning} color="bg-red-500" />
        <StatCard label="Empresas con alertas" value={empresasConAlertas} icon={TrendingDown} color="bg-amber-500" />
      </div>

      {/* Empresas Carousel */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-lg font-bold text-slate-800">Empresas con más documentos faltantes</h2>
          <span className="ml-auto text-sm text-slate-400">{empresasSorted.length}</span>
        </div>
        {isLoadingAll ? <Spinner /> : empresasSorted.length === 0 ? (
          <div className="card text-center py-10 text-slate-400">
            <FileWarning size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay empresas registradas</p>
          </div>
        ) : (
          <Swiper {...swiperConfig} className="pb-10">
            {empresasSorted.map((empresa) => (
              <SwiperSlide key={empresa.id}>
                <EmpresaCard empresa={empresa} faltantes={empresasFaltantes[empresa.id] ?? 0} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>

      {/* Trabajadores Carousel */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-red-500 rounded-full" />
          <h2 className="text-lg font-bold text-slate-800">Trabajadores con más documentos faltantes</h2>
          <span className="ml-auto text-sm text-slate-400">{trabajadoresSorted.length}</span>
        </div>
        {isLoadingAll ? <Spinner /> : trabajadoresSorted.length === 0 ? (
          <div className="card text-center py-10 text-slate-400">
            <Users size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay trabajadores registrados</p>
          </div>
        ) : (
          <Swiper {...swiperConfig} className="pb-10">
            {trabajadoresSorted.map((t) => (
              <SwiperSlide key={t.id}>
                <TrabajadorCard trabajador={t} faltantes={faltantesMap[t.id] ?? 0} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>
    </div>
  );
};