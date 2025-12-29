import { useState, useEffect } from 'react';
import type { ItemInventario } from '../types/inventario';
import { sanitizeText, validateNoXSS, validateNoSQLInjection } from '../utils/security';

interface ItemFormProps {
  item?: ItemInventario | null;
  categorias: string[];
  sedes: string[];
  items: ItemInventario[];
  onSave: (item: ItemInventario) => void;
  onCancel: () => void;
}

export default function ItemForm({ item, categorias, sedes, items, onSave, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState<Omit<ItemInventario, 'id'>>({
    nombre: '',
    categoria: categorias.length > 0 ? categorias[0] : '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    estado: 'Disponible',
    ubicacion: '',
    responsable: '',
    fechaAdquisicion: '',
    descripcion: '',
    observaciones: '',
    fechaUltimoMantenimiento: '',
    proximoMantenimiento: '',
    piso: '',
    edificio: '',
    sede: sedes.length > 0 ? sedes[0] : '',
    tipoUso: 'Administrativo',
    procesador: '',
    ram: '',
    discoDuro: ''
  });
  const [nombreError, setNombreError] = useState<string>('');

  useEffect(() => {
    if (item) {
      const { id, ...rest } = item;
      const categoriaValida = categorias.includes(rest.categoria) 
        ? rest.categoria 
        : (categorias.length > 0 ? categorias[0] : '');
      setFormData({ 
        nombre: rest.nombre,
        categoria: categoriaValida,
        marca: rest.marca,
        modelo: rest.modelo,
        numeroSerie: rest.numeroSerie,
        estado: rest.estado,
        ubicacion: rest.ubicacion,
        responsable: rest.responsable,
        fechaAdquisicion: rest.fechaAdquisicion || '',
        descripcion: rest.descripcion || '',
        observaciones: rest.observaciones || '',
        fechaUltimoMantenimiento: rest.fechaUltimoMantenimiento || '',
        proximoMantenimiento: rest.proximoMantenimiento || '',
        piso: rest.piso || '',
        edificio: rest.edificio || '',
        sede: rest.sede || (sedes.length > 0 ? sedes[0] : ''),
        tipoUso: rest.tipoUso || 'Administrativo',
        procesador: rest.procesador || '',
        ram: rest.ram || '',
        discoDuro: rest.discoDuro || ''
      });
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
        descripcion: '',
        observaciones: '',
        fechaUltimoMantenimiento: '',
        proximoMantenimiento: '',
        piso: '',
        edificio: '',
        sede: sedes.length > 0 ? sedes[0] : '',
        tipoUso: 'Administrativo',
        procesador: '',
        ram: '',
        discoDuro: ''
      });
      setNombreError(''); // Limpiar error al cambiar de item
    }
  }, [item, categorias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Sanitizar y validar inputs de texto
    if (type !== 'number' && typeof value === 'string') {
      // Validar contra XSS
      if (!validateNoXSS(value)) {
        setNombreError('El texto contiene caracteres no permitidos.');
        return;
      }
      
      // Validar contra inyección SQL
      if (!validateNoSQLInjection(value)) {
        setNombreError('El texto contiene patrones sospechosos.');
        return;
      }
      
      // Sanitizar el valor (pero mantenerlo editable)
      const sanitizedValue = sanitizeText(value);
      
      if (type === 'number') {
        const numValue = sanitizedValue === '' ? undefined : parseFloat(sanitizedValue);
        setFormData(prev => ({ ...prev, [name]: numValue }));
      } else {
        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
      }
    } else if (type === 'number') {
      const numValue = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Validar nombre único en tiempo real
    if (name === 'nombre') {
      const nombreNormalizado = value.trim().toLowerCase();
      const nombreDuplicado = items.find(existingItem => {
        const existingNombreNormalizado = existingItem.nombre.trim().toLowerCase();
        // Si estamos editando, excluir el item actual de la validación
        if (item && existingItem.id === item.id) {
          return false;
        }
        return existingNombreNormalizado === nombreNormalizado;
      });

      if (nombreDuplicado && value.trim() !== '') {
        setNombreError(`El nombre "${value}" ya existe en la base de datos.`);
      } else {
        setNombreError('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitizar todos los campos de texto antes de enviar
    const sanitizedData = {
      ...formData,
      nombre: sanitizeText(formData.nombre),
      marca: sanitizeText(formData.marca),
      modelo: sanitizeText(formData.modelo),
      numeroSerie: sanitizeText(formData.numeroSerie),
      ubicacion: sanitizeText(formData.ubicacion),
      responsable: sanitizeText(formData.responsable),
      descripcion: sanitizeText(formData.descripcion || ''),
      observaciones: sanitizeText(formData.observaciones || ''),
      piso: sanitizeText(formData.piso || ''),
      edificio: sanitizeText(formData.edificio || ''),
      procesador: sanitizeText(formData.procesador || ''),
      ram: sanitizeText(formData.ram || ''),
      discoDuro: sanitizeText(formData.discoDuro || '')
    };

    // Validar que no contenga código peligroso
    const fieldsToValidate = [
      sanitizedData.nombre,
      sanitizedData.marca,
      sanitizedData.modelo,
      sanitizedData.numeroSerie,
      sanitizedData.ubicacion,
      sanitizedData.responsable,
      sanitizedData.descripcion,
      sanitizedData.observaciones
    ];

    for (const field of fieldsToValidate) {
      if (field && (!validateNoXSS(field) || !validateNoSQLInjection(field))) {
        setNombreError('Uno o más campos contienen datos no permitidos.');
        return;
      }
    }
    
    // Validar nombre único antes de enviar
    const nombreNormalizado = sanitizedData.nombre.trim().toLowerCase();
    const nombreDuplicado = items.find(existingItem => {
      const existingNombreNormalizado = existingItem.nombre.trim().toLowerCase();
      // Si estamos editando, excluir el item actual de la validación
      if (item && existingItem.id === item.id) {
        return false;
      }
      return existingNombreNormalizado === nombreNormalizado;
    });

    if (nombreDuplicado) {
      setNombreError(`El nombre "${sanitizedData.nombre}" ya existe en la base de datos. Por favor, usa un nombre diferente.`);
      return;
    }

    const itemToSave: ItemInventario = {
      ...sanitizedData,
      id: item?.id || Date.now().toString()
    };
    // Usar datos sanitizados
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sección: Información General */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b-2 border-green-500 pb-2">
              Información General
            </h3>
            
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
                className={`w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-md ${
                  nombreError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {nombreError && (
                <p className="mt-1 text-sm text-red-600">{nombreError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-md"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="En Uso">En Uso</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div>
                <label htmlFor="tipoUso" className="block mb-1 text-sm text-gray-700">
                  Tipo de Uso *
                </label>
                <select
                  id="tipoUso"
                  name="tipoUso"
                  value={formData.tipoUso}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-md"
                >
                  <option value="Administrativo">Administrativo</option>
                  <option value="Alumnos">Alumnos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Ubicación y Responsabilidad */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b-2 border-green-500 pb-2">
              Ubicación y Responsabilidad
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sede" className="block mb-1 text-sm text-gray-700">
                  Sede *
                </label>
                <select
                  id="sede"
                  name="sede"
                  value={formData.sede}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-md"
                >
                  {sedes.length > 0 ? (
                    sedes.map(sede => (
                      <option key={sede} value={sede}>{sede}</option>
                    ))
                  ) : (
                    <option value="">Sin sedes disponibles</option>
                  )}
                </select>
              </div>

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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="piso" className="block mb-1 text-sm text-gray-700">
                  Piso
                </label>
                <select
                  id="piso"
                  name="piso"
                  value={formData.piso}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-md"
                >
                  <option value="">Seleccionar Piso</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div>
                <label htmlFor="edificio" className="block mb-1 text-sm text-gray-700">
                  Edificio
                </label>
                <select
                  id="edificio"
                  name="edificio"
                  value={formData.edificio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-md"
                >
                  <option value="">Seleccionar Edificio</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>

              <div className="md:col-span-2">
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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Sección: Especificaciones Técnicas */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b-2 border-green-500 pb-2">
              Especificaciones Técnicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="procesador" className="block mb-1 text-sm text-gray-700">
                  Procesador
                </label>
                <input
                  type="text"
                  id="procesador"
                  name="procesador"
                  value={formData.procesador}
                  onChange={handleChange}
                  placeholder="Ej: Intel Core i5-10400"
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="ram" className="block mb-1 text-sm text-gray-700">
                  RAM
                </label>
                <select
                  id="ram"
                  name="ram"
                  value={formData.ram}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white"
                >
                  <option value="">Seleccionar RAM</option>
                  <option value="8GB">8GB</option>
                  <option value="16GB">16GB</option>
                  <option value="32GB">32GB</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="discoDuro" className="block mb-1 text-sm text-gray-700">
                  Disco Duro
                </label>
                <select
                  id="discoDuro"
                  name="discoDuro"
                  value={formData.discoDuro}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white"
                >
                  <option value="">Seleccionar Disco Duro</option>
                  <option value="256GB">256GB</option>
                  <option value="500GB">500GB</option>
                  <option value="1TB">1TB</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Información de Adquisición */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b-2 border-green-500 pb-2">
              Información de Adquisición
            </h3>
            
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
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 rounded-md"
              />
            </div>
          </div>

          {/* Sección: Mantenimiento */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b-2 border-green-500 pb-2">
              Mantenimiento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaUltimoMantenimiento" className="block mb-1 text-sm text-gray-700">
                  Último Mantenimiento
                </label>
                <input
                  type="date"
                  id="fechaUltimoMantenimiento"
                  name="fechaUltimoMantenimiento"
                  value={formData.fechaUltimoMantenimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="proximoMantenimiento" className="block mb-1 text-sm text-gray-700">
                  Próximo Mantenimiento
                </label>
                <input
                  type="date"
                  id="proximoMantenimiento"
                  name="proximoMantenimiento"
                  value={formData.proximoMantenimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Sección: Observaciones y Descripción */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b-2 border-green-500 pb-2">
              Observaciones y Descripción
            </h3>
            
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
                placeholder="Información adicional sobre el equipo..."
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 resize-y"
              />
            </div>

            <div>
              <label htmlFor="observaciones" className="block mb-1 text-sm text-gray-700">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                placeholder="Notas adicionales, problemas conocidos, etc..."
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 resize-y"
              />
            </div>
          </div>

                  {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 hover:bg-gray-400 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
            >
              {item ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
