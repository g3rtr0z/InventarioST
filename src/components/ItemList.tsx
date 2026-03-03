import type { ItemInventario } from '../types/inventario';
import { INSTITUTIONAL_COLORS } from '../constants/colors';
import {
  FaEdit, FaTrash, FaMapMarkerAlt, FaTag, FaBuilding,
  FaMicrochip, FaMemory, FaHdd, FaProjectDiagram, FaUser, FaUserTie
} from 'react-icons/fa';

interface ItemListProps {
  items: ItemInventario[];
  onEdit: (item: ItemInventario) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  viewMode: 'cards' | 'table';
}

const ESTADO_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  'Disponible': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'En Uso': { bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-700' },
  'Mantenimiento': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Baja': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const getEstado = (estado: string) =>
  ESTADO_CONFIG[estado] ?? { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };

// Genera un color de fondo de icono basado en la categoría
const getCategoryAccent = (categoria: string): string => {
  const map: Record<string, string> = {
    'computadores': 'bg-blue-50 text-blue-600',
    'notebooks': 'bg-indigo-50 text-indigo-600',
    'proyectores': 'bg-purple-50 text-purple-600',
    'impresoras': 'bg-orange-50 text-orange-600',
    'monitores': 'bg-cyan-50 text-cyan-600',
    'servidores': 'bg-rose-50 text-rose-600',
  };
  const key = categoria.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v;
  }
  return 'bg-slate-50 text-slate-500';
};

// Inicial del nombre del ítem para el avatar de categoría
const getCategoryInitial = (categoria: string) => categoria.charAt(0).toUpperCase();

export default function ItemList({ items, onEdit, onDelete, searchTerm, viewMode }: ItemListProps) {
  const filteredItems = items.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.responsable.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <FaTag className="text-2xl text-slate-300" />
        </div>
        <p className="text-slate-500 font-bold text-sm">No se encontraron activos</p>
        <p className="text-slate-400 text-xs mt-1">Prueba ajustando los filtros de búsqueda</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── VISTA CARDS ── */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const estado = getEstado(item.estado);
            const catAccent = getCategoryAccent(item.categoria);
            const esProyector = item.categoria.toLowerCase().includes('proyector');

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Header card */}
                <div className="flex items-start gap-3 p-5 pb-4">
                  {/* Avatar categoría */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${catAccent}`}>
                    {getCategoryInitial(item.categoria)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-slate-800 leading-tight truncate group-hover:text-green-800 transition-colors">
                      {item.nombre}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5 truncate">
                      {item.marca} {item.modelo}
                    </p>
                  </div>

                  {/* Badge estado */}
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${estado.bg} ${estado.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                    {item.estado}
                  </span>
                </div>

                {/* Divider */}
                <div className="mx-5 border-t border-slate-100" />

                {/* Body: info compacta */}
                <div className="px-5 py-3 flex-grow space-y-2">
                  {/* Categoría + Tipo Uso */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      <FaTag className="text-[8px]" /> {item.categoria}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${item.tipoUso === 'Alumnos'
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                        : 'bg-green-50 border border-green-100 text-green-800'
                      }`}>
                      {item.tipoUso}
                    </span>
                  </div>

                  {/* Serie */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400 font-semibold">Serie</span>
                    <span className="font-mono text-slate-700 tracking-tight">{item.numeroSerie || '—'}</span>
                  </div>

                  {/* Sede + Ubicación */}
                  <div className="flex items-start gap-1.5 text-[11px]">
                    <FaMapMarkerAlt className="text-slate-300 mt-0.5 shrink-0 text-[10px]" />
                    <span className="text-slate-600 leading-tight">
                      <span className="font-bold text-slate-700">{item.sede}</span>
                      {item.ubicacion && ` · ${item.ubicacion}`}
                      {item.edificio && ` · Edif. ${item.edificio}`}
                      {item.piso && ` · Piso ${item.piso}`}
                    </span>
                  </div>

                  {/* Responsable + Encargado */}
                  <div className="flex items-center gap-3 text-[11px] flex-wrap">
                    {item.responsable && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <FaUser className="text-[9px] text-slate-300" />
                        {item.responsable}
                      </span>
                    )}
                    {item.encargado && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <FaUserTie className="text-[9px] text-slate-300" />
                        {item.encargado}
                      </span>
                    )}
                  </div>

                  {/* Specs PC */}
                  {!esProyector && (item.procesador || item.ram || item.discoDuro) && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {item.procesador && (
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          <FaMicrochip className="text-[8px]" /> {item.procesador}
                        </span>
                      )}
                      {item.ram && (
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          <FaMemory className="text-[8px]" /> {item.ram}
                        </span>
                      )}
                      {item.discoDuro && (
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          <FaHdd className="text-[8px]" /> {item.discoDuro}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Specs Proyector */}
                  {esProyector && (item.horasNormales || item.horasEco) && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {item.horasNormales && (
                        <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          <FaProjectDiagram className="text-[8px]" /> {item.horasNormales}h Normal
                        </span>
                      )}
                      {item.horasEco && (
                        <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          <FaProjectDiagram className="text-[8px]" /> {item.horasEco}h Eco
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer: acciones */}
                <div className="flex gap-2 px-5 py-4 border-t border-slate-100 mt-auto">
                  <button
                    onClick={() => onEdit(item)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${INSTITUTIONAL_COLORS.bgPrimary} text-white text-[11px] font-black rounded-xl hover:bg-green-900 transition-all active:scale-95 shadow-sm shadow-green-100`}
                  >
                    <FaEdit className="text-[10px]" /> Editar
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 border border-red-100 text-[11px] font-black rounded-xl hover:bg-red-100 transition-all active:scale-95"
                  >
                    <FaTrash className="text-[10px]" /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VISTA TABLA ── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  {['Activo', 'Categoría', 'Marca / Modelo', 'Serie', 'Estado', 'Sede', 'Ubicación', 'Piso', 'Tipo Uso', 'Responsable', 'Acciones'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const estado = getEstado(item.estado);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-green-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                    >
                      <td className="px-4 py-3 align-middle">
                        <span className="font-black text-slate-800 text-xs">{item.nombre}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap">
                          <FaTag className="text-[8px]" /> {item.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600 text-xs font-semibold whitespace-nowrap">
                        {item.marca} <span className="text-slate-400">{item.modelo}</span>
                      </td>
                      <td className="px-4 py-3 align-middle font-mono text-[10px] text-slate-500">{item.numeroSerie}</td>
                      <td className="px-4 py-3 align-middle">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap ${estado.bg} ${estado.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-700 whitespace-nowrap">
                          <FaBuilding className="text-slate-300 text-[10px]" /> {item.sede}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600 text-xs">{item.ubicacion}</td>
                      <td className="px-4 py-3 align-middle text-slate-500 text-xs">{item.piso || '—'}</td>
                      <td className="px-4 py-3 align-middle">
                        <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${item.tipoUso === 'Alumnos'
                            ? 'bg-emerald-50 text-emerald-700'
                            : `${INSTITUTIONAL_COLORS.bgPrimary} text-white`
                          }`}>
                          {item.tipoUso}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <FaUser className="text-slate-300 text-[9px]" /> {item.responsable}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex gap-1.5 items-center">
                          <button
                            onClick={() => onEdit(item)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 ${INSTITUTIONAL_COLORS.bgPrimary} text-white text-[10px] font-black rounded-lg hover:bg-green-900 transition-all active:scale-95 whitespace-nowrap`}
                          >
                            <FaEdit className="text-[9px]" /> Editar
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black rounded-lg hover:bg-red-100 transition-all active:scale-95 whitespace-nowrap"
                          >
                            <FaTrash className="text-[9px]" /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}