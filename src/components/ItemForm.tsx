import { useState, useEffect } from 'react';
import type { ItemInventario } from '../types/inventario';

interface ItemFormProps {
  item?: ItemInventario | null;
  categorias: string[];
  onSave: (item: ItemInventario) => void;
  onCancel: () => void;
}

export default function ItemForm({ item, categorias, onSave, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState<Omit<ItemInventario, 'id'>>({
    nombre: '',
    categoria: 'Computadora',
    marca: '',
    modelo: '',
    numeroSerie: '',
    estado: 'Disponible',
    ubicacion: '',
    responsable: '',
    fechaAdquisicion: '',
    descripcion: ''
  });

  useEffect(() => {
    if (item) {
      const { id, ...rest } = item;
      const categoriaValida = categorias.includes(rest.categoria) 
        ? rest.categoria 
        : (categorias.length > 0 ? categorias[0] : '');
      setFormData({ ...rest, categoria: categoriaValida });
    } else {
      setFormData({
        nombre: '',
        categoria: categorias.length > 0 ? categorias[0] : '',
        marca: '',
        modelo: '',
        numeroSerie: '',
        estado: 'Disponible',
        ubicacion: '',
        responsable: '',
        fechaAdquisicion: '',
        descripcion: ''
      });
    }
  }, [item, categorias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemToSave: ItemInventario = {
      ...formData,
      id: item?.id || Date.now().toString()
    };
    onSave(itemToSave);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {item ? 'Editar Item' : 'Agregar Item'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="nombre" className="block mb-1 text-sm text-gray-700">
              Nombre del Equipo *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Ej: PC Oficina 1"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="categoria" className="block mb-1 text-sm text-gray-700">
                Categoría *
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white"
              >
                {categorias.length > 0 ? (
                  categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                ) : (
                  <option value="">Sin categorías</option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="estado" className="block mb-1 text-sm text-gray-700">
                Estado *
              </label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white"
              >
                <option value="Disponible">Disponible</option>
                <option value="En Uso">En Uso</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="marca" className="block mb-1 text-sm text-gray-700">
                Marca *
              </label>
              <input
                type="text"
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
                placeholder="Ej: Dell, HP, Lenovo"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="modelo" className="block mb-1 text-sm text-gray-700">
                Modelo *
              </label>
              <input
                type="text"
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                required
                placeholder="Ej: OptiPlex 7090"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="numeroSerie" className="block mb-1 text-sm text-gray-700">
              Número de Serie *
            </label>
            <input
              type="text"
              id="numeroSerie"
              name="numeroSerie"
              value={formData.numeroSerie}
              onChange={handleChange}
              required
              placeholder="Ej: SN123456789"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ubicacion" className="block mb-1 text-sm text-gray-700">
                Ubicación *
              </label>
              <input
                type="text"
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                required
                placeholder="Ej: Oficina 101"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="responsable" className="block mb-1 text-sm text-gray-700">
                Responsable *
              </label>
              <input
                type="text"
                id="responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                required
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="fechaAdquisicion" className="block mb-1 text-sm text-gray-700">
              Fecha de Adquisición
            </label>
            <input
              type="date"
              id="fechaAdquisicion"
              name="fechaAdquisicion"
              value={formData.fechaAdquisicion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block mb-1 text-sm text-gray-700">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              placeholder="Información adicional..."
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 resize-y"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white hover:bg-green-600"
            >
              {item ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
