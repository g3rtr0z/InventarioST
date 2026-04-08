import { useState, useEffect } from 'react';
import type { ItemInventario } from '../types/inventario';
import { sanitizeText, validateNoXSS, validateNoSQLInjection } from '../utils/security';
import { getConfig, subscribeToConfig, type ConfiguracionSistema, type CampoFormulario, type SeccionFormulario } from '../services/configService';
import { INSTITUTIONAL_COLORS } from '../constants/colors';
import type { UserInfo } from '../services/userRoleService';

interface ItemFormProps {
  item?: ItemInventario | null;
  categorias: string[];
  sedes: string[];
  items: ItemInventario[];
  onSave: (item: ItemInventario) => void;
  onCancel: () => void;
  currentUserEmail?: string;
  currentUserName?: string;
  isAdmin?: boolean;
  usuarios?: UserInfo[];
}

export default function ItemForm({ item, categorias, sedes, items, onSave, onCancel, currentUserEmail = '', currentUserName = '', isAdmin = false, usuarios = [] }: ItemFormProps) {
  const [formData, setFormData] = useState<Omit<ItemInventario, 'id'> & { [key: string]: any }>({
    nombre: '',
    categoria: categorias.length > 0 ? categorias[0] : '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    estado: 'Disponible',
    ubicacion: '',
    responsable: '',
    piso: '',
    edificio: '',
    sede: sedes.length > 0 ? sedes[0] : '',
    tipoUso: 'Administrativo',
    procesador: '',
    ram: '',
    discoDuro: '',
    horasNormales: '',
    horasEco: '',
    tipoConexion: '',
    encargado: ''
  });
  const [nombreError, setNombreError] = useState<string>('');
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema | null>(null);
  const [configFormulario, setConfigFormulario] = useState<CampoFormulario[]>([]);
  const [seccionesFormulario, setSeccionesFormulario] = useState<SeccionFormulario[]>([]);

  // Cargar configuración del formulario
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getConfig();
        setConfiguracion(config);
        setConfigFormulario(config.formulario || []);
        setSeccionesFormulario(config.seccionesFormulario || []);

        // Inicializar campos personalizados en formData
        const camposPersonalizados = config.formulario || [];
        setFormData(prev => {
          const nuevoFormData = { ...prev };
          camposPersonalizados.forEach((campo: CampoFormulario) => {
            if (!(campo.nombre in nuevoFormData)) {
              nuevoFormData[campo.nombre] = '';
            }
          });
          return nuevoFormData;
        });
      } catch (err) {
        console.error('Error al cargar configuración del formulario:', err);
      }
    };

    loadConfig();

    // Suscribirse a cambios en la configuración
    const unsubscribe = subscribeToConfig((config) => {
      setConfiguracion(config);
      setConfigFormulario(config.formulario || []);
      setSeccionesFormulario(config.seccionesFormulario || []);

      // Inicializar campos personalizados en formData si no existen
      const camposPersonalizados = config.formulario || [];
      setFormData(prev => {
        const nuevoFormData = { ...prev };
        camposPersonalizados.forEach((campo: CampoFormulario) => {
          if (!(campo.nombre in nuevoFormData)) {
            nuevoFormData[campo.nombre] = '';
          }
        });
        return nuevoFormData;
      });
    });

    return () => unsubscribe();
  }, []);

  // Función helper para obtener configuración de un campo
  const getCampoConfig = (nombreCampo: string): CampoFormulario | undefined => {
    return configFormulario.find((c: CampoFormulario) => c.nombre === nombreCampo);
  };


  // Función helper para verificar si un campo es obligatorio
  const isCampoObligatorio = (nombreCampo: string): boolean => {
    const config = getCampoConfig(nombreCampo);
    return config ? config.obligatorio : false; // Por defecto opcional si no hay config
  };

  // Función helper para obtener la etiqueta de un campo
  const getCampoLabel = (nombreCampo: string, labelDefault: string): string => {
    const config = getCampoConfig(nombreCampo);
    return config?.etiqueta || labelDefault;
  };

  // Función helper para obtener siglas de sede
  const getSedeSigla = (sede: string): string => {
    if (!sede) return 'SN';
    const words = sede.trim().split(/\s+/);
    if (words.length >= 2) {
      // Tomar inicial de la 1° + 3 letras de la 2° (ej: Manuel Rodriguez -> MROD)
      return (words[0][0] + words[1].substring(0, 3)).toUpperCase();
    }
    // Tomar primeras 4 letras (ej: Rancagua -> RANC)
    return sede.substring(0, 4).toUpperCase();
  };

  // Función helper para obtener campos ordenados de una sección
  const getCamposOrdenados = (seccion: string): CampoFormulario[] => {
    // Normalizar nombres de sección para la búsqueda de campos (compatibilidad con nombres antiguos)
    const esObservaciones = seccion === 'Observaciones' || seccion === 'Observaciones y Descripción';

    return configFormulario
      .filter((c: CampoFormulario) => {
        if (!c.visible || c.nombre === 'descripcion') return false;
        if (esObservaciones) {
          return c.seccion === 'Observaciones' || c.seccion === 'Observaciones y Descripción';
        }
        return c.seccion === seccion;
      })
      .sort((a: CampoFormulario, b: CampoFormulario) => a.orden - b.orden);
  };

  // Lista de campos conocidos que tienen renderizado especial
  const camposConocidos = [
    'nombre', 'categoria', 'estado', 'tipoUso',
    'sede', 'ubicacion', 'piso', 'edificio', 'responsable', 'encargado',
    'marca', 'modelo', 'numeroSerie', 'procesador', 'ram', 'discoDuro'
  ];

  // Función para renderizar un campo genérico basándose en su tipo
  const renderCampoGenerico = (campoConfig: CampoFormulario) => {
    const campoNombre = campoConfig.nombre;
    // Si es un campo conocido, no lo renderizamos aquí (ya tiene renderizado especial)
    if (camposConocidos.includes(campoNombre)) {
      return null;
    }

    const campoValor = formData[campoNombre] || '';
    const campoLabel = campoConfig.etiqueta || campoNombre;
    const esObligatorio = campoConfig.obligatorio || false;
    const tipoCampo = campoConfig.tipo || 'text';

    const baseClasses = `w-full px-3 py-2.5 text-sm border border-slate-200 focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent rounded-xl bg-white transition-all`;

    switch (tipoCampo) {
      case 'number':
        return (
          <div key={campoNombre}>
            <label htmlFor={campoNombre} className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {campoLabel} {esObligatorio && '*'}
            </label>
            <input
              type="number"
              id={campoNombre}
              name={campoNombre}
              value={campoValor}
              onChange={handleChange}
              required={esObligatorio}
              className={baseClasses}
            />
          </div>
        );

      case 'date':
        return (
          <div key={campoNombre}>
            <label htmlFor={campoNombre} className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {campoLabel} {esObligatorio && '*'}
            </label>
            <input
              type="date"
              id={campoNombre}
              name={campoNombre}
              value={campoValor}
              onChange={handleChange}
              required={esObligatorio}
              className={baseClasses}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={campoNombre} className="md:col-span-2">
            <label htmlFor={campoNombre} className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {campoLabel} {esObligatorio && '*'}
            </label>
            <textarea
              id={campoNombre}
              name={campoNombre}
              value={campoValor}
              onChange={handleChange}
              required={esObligatorio}
              rows={3}
              className={`${baseClasses} resize-y`}
            />
          </div>
        );

      case 'select':
        // Para select, necesitaríamos opciones. Por ahora lo dejamos como text
        return (
          <div key={campoNombre}>
            <label htmlFor={campoNombre} className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {campoLabel} {esObligatorio && '*'}
            </label>
            <input
              type="text"
              id={campoNombre}
              name={campoNombre}
              value={campoValor}
              onChange={handleChange}
              required={esObligatorio}
              placeholder={`Ingrese ${campoLabel.toLowerCase()}`}
              className={baseClasses}
            />
          </div>
        );

      default: // text
        return (
          <div key={campoNombre}>
            <label htmlFor={campoNombre} className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {campoLabel} {esObligatorio && '*'}
            </label>
            <input
              type="text"
              id={campoNombre}
              name={campoNombre}
              value={campoValor}
              onChange={handleChange}
              required={esObligatorio}
              placeholder={`Ingrese ${campoLabel.toLowerCase()}`}
              className={baseClasses}
            />
          </div>
        );
    }
  };

  useEffect(() => {
    if (item) {
      const { id, ...rest } = item;
      const categoriaValida = categorias.includes(rest.categoria)
        ? rest.categoria
        : (categorias.length > 0 ? categorias[0] : '');
      // Incluir todos los campos del item, incluyendo campos personalizados
      const nuevoFormData: any = {
        nombre: rest.nombre,
        categoria: categoriaValida,
        marca: rest.marca,
        modelo: rest.modelo,
        numeroSerie: rest.numeroSerie,
        estado: rest.estado,
        ubicacion: rest.ubicacion,
        responsable: rest.responsable,
        piso: rest.piso || '',
        edificio: rest.edificio || '',
        sede: rest.sede || (sedes.length > 0 ? sedes[0] : ''),
        tipoUso: rest.tipoUso || 'Administrativo',
        procesador: rest.procesador || '',
        ram: rest.ram || '',
        discoDuro: rest.discoDuro || '',
        horasNormales: (rest as any).horasNormales || '',
        horasEco: (rest as any).horasEco || '',
        tipoConexion: (rest as any).tipoConexion || '',
      };

      // Agregar campos personalizados del item si existen
      Object.keys(rest).forEach(key => {
        if (!(key in nuevoFormData)) {
          nuevoFormData[key] = (rest as any)[key] || '';
        }
      });

      // Incluir encargado si existe en el item
      if (rest.encargado) {
        nuevoFormData.encargado = rest.encargado;
      }

      setFormData(nuevoFormData);
    } else {
      // Al crear un nuevo item, establecer el encargado con el nombre y correo del usuario actual
      const encargadoValue = currentUserName && currentUserEmail
        ? `${currentUserName} (${currentUserEmail})`
        : currentUserEmail || '';

      setFormData({
        nombre: '',
        categoria: categorias.length > 0 ? categorias[0] : '',
        marca: '',
        modelo: '',
        numeroSerie: '',
        estado: 'Disponible',
        ubicacion: '',
        responsable: '',
        descripcion: '',
        piso: '',
        edificio: '',
        sede: sedes.length > 0 ? sedes[0] : '',
        tipoUso: 'Administrativo',
        procesador: '',
        ram: '',
        discoDuro: '',
        horasNormales: '',
        horasEco: '',
        tipoConexion: '',
        encargado: encargadoValue
      });
      setNombreError(''); // Limpiar error al cambiar de item
    }
  }, [item, categorias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Permitir que el usuario escriba normalmente, solo validar patrones peligrosos
    if (type !== 'number' && typeof value === 'string') {
      // Validar contra XSS (solo bloquear si es realmente peligroso)
      if (!validateNoXSS(value)) {
        setNombreError('El texto contiene caracteres no permitidos.');
        return;
      }

      // Validar contra inyección SQL (solo bloquear si es realmente peligroso)
      if (!validateNoSQLInjection(value)) {
        setNombreError('El texto contiene patrones sospechosos.');
        return;
      }

      // NO sanitizar mientras escribe, permitir espacios y caracteres normales
      // Guardar el valor tal cual lo escribe el usuario
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (type === 'number') {
      const numValue = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Si cambia la categoría a Proyectores, limpiar el nombre
    if (name === 'categoria' && value.toLowerCase() === 'proyectores') {
      setFormData(prev => ({ ...prev, nombre: '' }));
      setNombreError('');
    }

    // Si cambia la marca y es proyector, limpiar el modelo
    if (name === 'marca' && formData.categoria.toLowerCase() === 'proyectores') {
      setFormData(prev => ({ ...prev, modelo: '' }));
    }

    // Validar nombre único en tiempo real (solo si no es proyector)
    if (name === 'nombre') {
      const esProyector = formData.categoria.toLowerCase() === 'proyectores';
      if (esProyector) {
        // Para proyectores, no validar y limpiar el nombre
        setFormData(prev => ({ ...prev, nombre: '' }));
        setNombreError('');
        return;
      }

      const nombreNormalizado = value.trim().toLowerCase();
      const nombreDuplicado = items.find(existingItem => {
        const existingNombreNormalizado = existingItem.nombre.trim().toLowerCase();
        // Ignorar equipos dados de baja al validar duplicados
        if (existingItem.estado === 'Baja') {
          return false;
        }
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
      piso: sanitizeText(formData.piso || ''),
      edificio: sanitizeText(formData.edificio || ''),
      procesador: sanitizeText(formData.procesador || ''),
      ram: sanitizeText(formData.ram || ''),
      discoDuro: sanitizeText(formData.discoDuro || ''),
      horasNormales: sanitizeText(formData.horasNormales || ''),
      horasEco: sanitizeText(formData.horasEco || ''),
      tipoConexion: sanitizeText(formData.tipoConexion || ''),
      encargado: formData.encargado ? sanitizeText(formData.encargado) : undefined
    };

    // Validar que no contenga código peligroso
    const fieldsToValidate = [
      sanitizedData.nombre,
      sanitizedData.marca,
      sanitizedData.modelo,
      sanitizedData.numeroSerie,
      sanitizedData.ubicacion,
      sanitizedData.responsable,
      sanitizedData.encargado
    ];

    for (const field of fieldsToValidate) {
      if (field && (!validateNoXSS(field) || !validateNoSQLInjection(field))) {
        setNombreError('Uno o más campos contienen datos no permitidos.');
        return;
      }
    }

    // Validar nombre único antes de enviar (solo si no es proyector)
    const esProyector = sanitizedData.categoria.toLowerCase() === 'proyectores';
    if (!esProyector) {
      const nombreNormalizado = sanitizedData.nombre.trim().toLowerCase();
      const nombreDuplicado = items.find(existingItem => {
        const existingNombreNormalizado = existingItem.nombre.trim().toLowerCase();
        // Ignorar equipos dados de baja al validar duplicados
        if (existingItem.estado === 'Baja') {
          return false;
        }
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
    } else {
      // Para proyectores, generar nombre basado en sede, ubicación y edificio (al final)
      const sedeSigla = getSedeSigla(sanitizedData.sede);
      const edificioLetra = sanitizedData.edificio ? sanitizedData.edificio.trim().charAt(0).toUpperCase() : '';
      const ubicacionLimpia = sanitizedData.ubicacion ? sanitizedData.ubicacion.replace(/\s+/g, '').toUpperCase() : 'SALA';

      sanitizedData.nombre = `PROY-${sedeSigla}-${ubicacionLimpia}${edificioLetra}`;
    }

    // Ajustar sufijo " - Baja" según el estado
    const regexSufijoBaja = /\s+-\s*Baja$/i;
    if (sanitizedData.estado === 'Baja') {
      // Asegurar que el nombre termine en " - Baja" sin duplicar el sufijo
      const nombreBase = sanitizedData.nombre.replace(regexSufijoBaja, '');
      sanitizedData.nombre = `${nombreBase} - Baja`;
    } else {
      // Para cualquier otro estado (Ej: "En Uso"), quitar el sufijo " - Baja" si existe
      sanitizedData.nombre = sanitizedData.nombre.replace(regexSufijoBaja, '');
    }

    const itemToSave: ItemInventario = {
      ...sanitizedData,
      id: item?.id || Date.now().toString()
    };
    // Usar datos sanitizados
    onSave(itemToSave);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-end sm:items-center z-[60] pb-16 sm:pb-0">
      {/* Panel: bottom sheet en móvil, modal centrado en desktop */}
      <div
        className="bg-[#f8fafc] w-full sm:max-w-2xl flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl"
        style={{ maxHeight: 'calc(100dvh - 56px - 64px)', height: 'calc(100dvh - 56px - 64px)' }}
      >
        {/* ── HEADER FIJO ── */}
        <div className="flex items-center justify-between px-5 py-4 bg-white rounded-t-3xl sm:rounded-t-2xl border-b border-slate-100 shrink-0">
          {/* Pill drag handle solo en móvil */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 rounded-full sm:hidden" />
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 ${INSTITUTIONAL_COLORS.bgPrimary} rounded-xl flex items-center justify-center shadow-sm`}>
              <span className="text-white text-sm font-black">{item ? '✎' : '+'}</span>
            </div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">
              {item ? 'Editar Activo' : 'Nuevo Activo'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* ── CUERPO SCROLLEABLE ── */}
        <div className="flex-1 overflow-y-auto">
          <form id="item-form" onSubmit={handleSubmit} className="px-5 py-5 space-y-5">

            {/* Renderizar secciones dinámicamente */}
            {seccionesFormulario
              .filter((s: SeccionFormulario) => s.visible && s.nombre !== 'Información de Adquisición' && s.nombre !== 'Mantenimiento' && s.nombre !== 'Descripción')
              .sort((a: SeccionFormulario, b: SeccionFormulario) => a.orden - b.orden)
              .map((seccion: SeccionFormulario) => {
                const camposSeccion = getCamposOrdenados(seccion.nombre);
                if (camposSeccion.length === 0) return null;

                // Renderizado especial para "Información General"
                if (seccion.nombre === 'Información General') {
                  // Separar campos que van en grid vs campos que van solos
                  const camposGrid = ['categoria', 'estado', 'tipoUso'];
                  const camposEnGrid = camposSeccion.filter((c: CampoFormulario) => camposGrid.includes(c.nombre));
                  const camposSolo = camposSeccion.filter((c: CampoFormulario) => !camposGrid.includes(c.nombre));

                  // Determinar si hay campos antes del grid
                  const primerCampoGrid = camposEnGrid.length > 0 ? camposEnGrid[0] : null;
                  const camposAntesDelGrid = primerCampoGrid
                    ? camposSolo.filter((c: CampoFormulario) => c.orden < primerCampoGrid.orden)
                    : camposSolo;
                  const camposDespuesDelGrid = primerCampoGrid
                    ? camposSolo.filter((c: CampoFormulario) => c.orden > primerCampoGrid.orden)
                    : [];

                  return (
                    <div key={seccion.nombre} className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b-2 border-green-600">
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                          {seccion.etiqueta || seccion.nombre}
                        </h3>
                      </div>

                      {/* Campos antes del grid */}
                      {camposAntesDelGrid.map((campoConfig: CampoFormulario) => {
                        if (campoConfig.nombre === 'nombre') {
                          const esProyector = formData.categoria.toLowerCase() === 'proyectores';
                          return (
                            <div key={campoConfig.nombre}>
                              <label htmlFor="nombre" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                {getCampoLabel('nombre', 'Nombre del Equipo')} {!esProyector && isCampoObligatorio('nombre') && '*'}
                                {esProyector && <span className="text-gray-500 text-xs ml-2">(No aplica para Proyectores)</span>}
                              </label>
                              <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required={!esProyector && isCampoObligatorio('nombre')}
                                disabled={esProyector}
                                placeholder={esProyector ? (() => {
                                  const ed = formData.edificio ? formData.edificio.trim().charAt(0).toUpperCase() : '';
                                  const ubicacion = formData.ubicacion.replace(/\s+/g, '').toUpperCase() || 'SALA';
                                  return `Ej: PROY-${getSedeSigla(formData.sede)}-${ubicacion}${ed}`;
                                })() : "Ej: PC Oficina 1"}
                                className={`w-full px-3 py-2 border focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent rounded-xl ${nombreError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                                  } ${esProyector ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                              />
                              {nombreError && !esProyector && (
                                <p className="mt-1 text-sm text-red-600">{nombreError}</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}

                      {/* Grid con categoria, estado y tipoUso */}
                      {camposEnGrid.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {camposEnGrid.map((campoConfig: CampoFormulario) => {
                            if (campoConfig.nombre === 'categoria') {
                              return (
                                <div key={campoConfig.nombre}>
                                  <label htmlFor="categoria" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                    {getCampoLabel('categoria', 'Categoría')} {isCampoObligatorio('categoria') && '*'}
                                  </label>
                                  <select
                                    id="categoria"
                                    name="categoria"
                                    value={formData.categoria}
                                    onChange={handleChange}
                                    required={isCampoObligatorio('categoria')}
                                    className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} bg-white rounded-xl`}
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
                              );
                            }

                            if (campoConfig.nombre === 'estado') {
                              return (
                                <div key={campoConfig.nombre}>
                                  <label htmlFor="estado" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                    {getCampoLabel('estado', 'Estado')} {isCampoObligatorio('estado') && '*'}
                                  </label>
                                  <select
                                    id="estado"
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    required={isCampoObligatorio('estado')}
                                    className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} bg-white rounded-xl`}
                                  >
                                    {configuracion?.estados && configuracion.estados.length > 0 ? (
                                      configuracion.estados.map(estado => (
                                        <option key={estado.nombre} value={estado.nombre}>{estado.nombre}</option>
                                      ))
                                    ) : (
                                      <>
                                        <option value="Disponible">Disponible</option>
                                        <option value="En Uso">En Uso</option>
                                        <option value="Mantenimiento">Mantenimiento</option>
                                        <option value="Baja">Baja</option>
                                      </>
                                    )}
                                  </select>
                                </div>
                              );
                            }

                            if (campoConfig.nombre === 'tipoUso') {
                              return (
                                <div key={campoConfig.nombre}>
                                  <label htmlFor="tipoUso" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                    {getCampoLabel('tipoUso', 'Tipo de Uso')} {isCampoObligatorio('tipoUso') && '*'}
                                  </label>
                                  <select
                                    id="tipoUso"
                                    name="tipoUso"
                                    value={formData.tipoUso}
                                    onChange={handleChange}
                                    required={isCampoObligatorio('tipoUso')}
                                    className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} bg-white rounded-xl`}
                                  >
                                    <option value="Administrativo">Administrativo</option>
                                    <option value="Alumnos">Alumnos</option>
                                  </select>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}

                      {/* Campos después del grid */}
                      {camposDespuesDelGrid.map((campoConfig: CampoFormulario) => {
                        if (campoConfig.nombre === 'nombre') {
                          const esProyector = formData.categoria.toLowerCase() === 'proyectores';
                          return (
                            <div key={campoConfig.nombre}>
                              <label htmlFor="nombre" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                {getCampoLabel('nombre', 'Nombre del Equipo')} {!esProyector && isCampoObligatorio('nombre') && '*'}
                                {esProyector && <span className="text-gray-500 text-xs ml-2">(No aplica para Proyectores)</span>}
                              </label>
                              <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required={!esProyector && isCampoObligatorio('nombre')}
                                disabled={esProyector}
                                placeholder={esProyector ? (() => {
                                  const ed = formData.edificio ? formData.edificio.trim().charAt(0).toUpperCase() : '';
                                  const ubicacion = formData.ubicacion.replace(/\s+/g, '').toUpperCase() || 'SALA';
                                  return `Ej: PROY-${getSedeSigla(formData.sede)}-${ubicacion}${ed}`;
                                })() : "Ej: PC Oficina 1"}
                                className={`w-full px-3 py-2 border focus:outline-none focus:ring-2 ${INSTITUTIONAL_COLORS.ringPrimaryFocus} focus:border-transparent rounded-xl ${nombreError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                                  } ${esProyector ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                              />
                              {nombreError && !esProyector && (
                                <p className="mt-1 text-sm text-red-600">{nombreError}</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}

                      {/* Renderizar campos personalizados de esta sección */}
                      {camposSeccion
                        .filter((c: CampoFormulario) => !camposConocidos.includes(c.nombre))
                        .map((campoConfig: CampoFormulario) => renderCampoGenerico(campoConfig))
                        .filter(Boolean)}
                    </div>
                  );
                }

                // Renderizado genérico para otras secciones
                // Verificar si es proyector y si es sección de especificaciones técnicas
                const esProyector = formData.categoria.toLowerCase() === 'proyectores';
                const esSeccionEspecificaciones = seccion.nombre.toLowerCase().includes('especificaciones') ||
                  seccion.nombre.toLowerCase().includes('técnicas') ||
                  seccion.nombre.toLowerCase().includes('tecnicas');

                return (
                  <div key={seccion.nombre} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b-2 border-green-600">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                        {seccion.nombre === 'Observaciones y Descripción' ? 'Observaciones' : (seccion.etiqueta || seccion.nombre)}
                      </h3>
                    </div>

                    {/* Renderizar todos los campos de la sección */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {camposSeccion.map((campoConfig: CampoFormulario) => {
                        // Renderizar campos conocidos con su lógica especial
                        if (campoConfig.nombre === 'sede') {
                          return (
                            <div key={campoConfig.nombre}>
                              <label htmlFor="sede" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                {getCampoLabel('sede', 'Sede')} {isCampoObligatorio('sede') && '*'}
                              </label>
                              <select
                                id="sede"
                                name="sede"
                                value={formData.sede}
                                onChange={handleChange}
                                required={isCampoObligatorio('sede')}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-xl"
                              >
                                {configuracion?.sedes && configuracion.sedes.length > 0 ? (
                                  configuracion.sedes.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))
                                ) : sedes && sedes.length > 0 ? (
                                  sedes.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))
                                ) : (
                                  <option value="">Sin sedes disponibles</option>
                                )}
                              </select>
                            </div>
                          );
                        }

                        if (campoConfig.nombre === 'ubicacion') {
                          return (
                            <div key={campoConfig.nombre}>
                              <label htmlFor="ubicacion" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                {getCampoLabel('ubicacion', 'Ubicación')} {isCampoObligatorio('ubicacion') && '*'}
                              </label>
                              <input
                                type="text"
                                id="ubicacion"
                                name="ubicacion"
                                value={formData.ubicacion}
                                onChange={handleChange}
                                required={isCampoObligatorio('ubicacion')}
                                placeholder="Ej: Oficina 101"
                                className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                              />
                            </div>
                          );
                        }

                        if (campoConfig.nombre === 'piso') {
                          return (
                            <div key={campoConfig.nombre}>
                              <label htmlFor="piso" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                {getCampoLabel('piso', 'Piso')} {isCampoObligatorio('piso') && '*'}
                              </label>
                              <select
                                id="piso"
                                name="piso"
                                value={formData.piso}
                                onChange={handleChange}
                                required={isCampoObligatorio('piso')}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-xl"
                              >
                                <option value="">Seleccionar Piso</option>
                                {configuracion?.pisos ? (
                                  configuracion.pisos.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                  ))
                                ) : (
                                  <>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                  </>
                                )}
                              </select>
                            </div>
                          );
                        }

                        if (campoConfig.nombre === 'edificio') {
                          return (
                            <div key={campoConfig.nombre}>
                              <label htmlFor="edificio" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                {getCampoLabel('edificio', 'Edificio')} {isCampoObligatorio('edificio') && '*'}
                              </label>
                              <select
                                id="edificio"
                                name="edificio"
                                value={formData.edificio}
                                onChange={handleChange}
                                required={isCampoObligatorio('edificio')}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-xl"
                              >
                                <option value="">Seleccionar Edificio</option>
                                {configuracion?.edificios ? (
                                  configuracion.edificios.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                  ))
                                ) : (
                                  <>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                  </>
                                )}
                              </select>
                            </div>
                          );
                        }

                        if (campoConfig.nombre === 'responsable') {
                          return (
                            <>
                              <div key={campoConfig.nombre} className="md:col-span-2">
                                <label htmlFor="responsable" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  {getCampoLabel('responsable', 'Responsable')} {isCampoObligatorio('responsable') && '*'}
                                </label>
                                <input
                                  type="text"
                                  id="responsable"
                                  name="responsable"
                                  value={formData.responsable}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('responsable')}
                                  placeholder="Ej: Juan Pérez"
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                                />
                              </div>
                              {/* Campo Encargado - Siempre visible después de Responsable */}
                              <div key="encargado" className="md:col-span-2">
                                <label htmlFor="encargado" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  Encargado (quien creó el item)
                                  {isAdmin && <span className="text-gray-500 text-xs ml-2">(Editable para administradores)</span>}
                                </label>
                                {isAdmin ? (
                                  <select
                                    id="encargado"
                                    name="encargado"
                                    value={formData.encargado || ''}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl bg-white`}
                                  >
                                    <option value="">Seleccione un usuario</option>
                                    {usuarios
                                      .filter((usuario) => usuario.isActive)
                                      .map((usuario) => {
                                        const displayText = usuario.displayName
                                          ? `${usuario.displayName} (${usuario.email})`
                                          : usuario.email;
                                        return (
                                          <option key={usuario.email} value={displayText}>
                                            {displayText}
                                          </option>
                                        );
                                      })}
                                  </select>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      id="encargado"
                                      name="encargado"
                                      value={formData.encargado || ''}
                                      readOnly
                                      disabled
                                      className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-xl cursor-not-allowed"
                                      placeholder="Se establece automáticamente al crear el item"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Este campo se establece automáticamente con el nombre y correo del usuario que crea el item</p>
                                  </>
                                )}
                              </div>
                            </>
                          );
                        }

                        if (campoConfig.nombre === 'encargado') {
                          // Ya se renderiza después de responsable, no renderizar aquí
                          return null;
                        }

                        if (campoConfig.nombre === 'marca') {
                          return (
                            <div key={campoConfig.nombre}>
                              <label htmlFor="marca" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                {getCampoLabel('marca', 'Marca')} {isCampoObligatorio('marca') && '*'}
                              </label>
                              {esProyector ? (
                                <select
                                  id="marca"
                                  name="marca"
                                  value={formData.marca}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('marca')}
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} bg-white rounded-xl`}
                                >
                                  <option value="">Seleccione una marca</option>
                                  <option value="Epson">Epson</option>
                                  <option value="Viewsonic">Viewsonic</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  id="marca"
                                  name="marca"
                                  value={formData.marca}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('marca')}
                                  placeholder="Ej: Dell, HP, Lenovo"
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                                />
                              )}
                            </div>
                          );
                        }

                        if (campoConfig.nombre === 'modelo') {
                          const modelsForBrand = formData.marca === 'Epson'
                            ? ['X05+', 'E20', 'EB-L260F']
                            : formData.marca === 'Viewsonic'
                              ? ['PA503W']
                              : [];

                          return (
                            <div key={campoConfig.nombre}>
                              <label htmlFor="modelo" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                {getCampoLabel('modelo', 'Modelo')} {isCampoObligatorio('modelo') && '*'}
                              </label>
                              {esProyector && modelsForBrand.length > 0 ? (
                                <select
                                  id="modelo"
                                  name="modelo"
                                  value={formData.modelo}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('modelo')}
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} bg-white rounded-xl`}
                                >
                                  <option value="">Seleccione un modelo</option>
                                  {modelsForBrand.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  id="modelo"
                                  name="modelo"
                                  value={formData.modelo}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('modelo')}
                                  placeholder={esProyector ? "Primero seleccione una marca" : "Ej: OptiPlex 7090"}
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                                />
                              )}
                            </div>
                          );
                        }

                        if (campoConfig.nombre === 'numeroSerie') {
                          return (
                            <div key={campoConfig.nombre}>
                              <label htmlFor="numeroSerie" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                {getCampoLabel('numeroSerie', 'Número de Serie')} {isCampoObligatorio('numeroSerie') && '*'}
                              </label>
                              <input
                                type="text"
                                id="numeroSerie"
                                name="numeroSerie"
                                value={formData.numeroSerie}
                                onChange={handleChange}
                                required={isCampoObligatorio('numeroSerie')}
                                placeholder="Ej: SN123456789"
                                className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                              />
                            </div>
                          );
                        }

                        // Para Proyectores, mostrar campos específicos en Especificaciones Técnicas
                        if (esProyector && esSeccionEspecificaciones) {
                          // Para proyectores, ocultar procesador, ram, discoDuro
                          if (campoConfig.nombre === 'procesador' || campoConfig.nombre === 'ram' || campoConfig.nombre === 'discoDuro') {
                            return null;
                          }

                          // Renderizar marca en especificaciones técnicas para proyectores
                          if (campoConfig.nombre === 'marca') {
                            return (
                              <div key="marca-especificaciones">
                                <label htmlFor="marca-especificaciones" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  Marca {isCampoObligatorio('marca') && '*'}
                                </label>
                                <select
                                  id="marca-especificaciones"
                                  name="marca"
                                  value={formData.marca}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('marca')}
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} bg-white rounded-xl`}
                                >
                                  <option value="">Seleccione una marca</option>
                                  <option value="Epson">Epson</option>
                                  <option value="Viewsonic">Viewsonic</option>
                                </select>
                              </div>
                            );
                          }
                          if (campoConfig.nombre === 'modelo') {
                            const modelsForBrand = formData.marca === 'Epson'
                              ? ['X05+', 'E20', 'EB-L260F']
                              : formData.marca === 'Viewsonic'
                                ? ['PA503W']
                                : [];

                            return (
                              <div key="modelo-especificaciones">
                                <label htmlFor="modelo-especificaciones" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  Modelo {isCampoObligatorio('modelo') && '*'}
                                </label>
                                {modelsForBrand.length > 0 ? (
                                  <select
                                    id="modelo-especificaciones"
                                    name="modelo"
                                    value={formData.modelo}
                                    onChange={handleChange}
                                    required={isCampoObligatorio('modelo')}
                                    className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} bg-white rounded-xl`}
                                  >
                                    <option value="">Seleccione un modelo</option>
                                    {modelsForBrand.map(model => (
                                      <option key={model} value={model}>{model}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    id="modelo-especificaciones"
                                    name="modelo"
                                    value={formData.modelo}
                                    onChange={handleChange}
                                    required={isCampoObligatorio('modelo')}
                                    placeholder="Primero seleccione una marca"
                                    className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                                  />
                                )}
                              </div>
                            );
                          }

                          // Renderizar numeroSerie en especificaciones técnicas para proyectores
                          if (campoConfig.nombre === 'numeroSerie') {
                            return (
                              <div key="numeroSerie-especificaciones">
                                <label htmlFor="numeroSerie-especificaciones" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  Número de Serie {isCampoObligatorio('numeroSerie') && '*'}
                                </label>
                                <input
                                  type="text"
                                  id="numeroSerie-especificaciones"
                                  name="numeroSerie"
                                  value={formData.numeroSerie}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('numeroSerie')}
                                  placeholder="Ej: SN123456789"
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                                />
                              </div>
                            );
                          }

                          // Renderizar horasNormales
                          if (campoConfig.nombre === 'horasNormales' || (campoConfig.nombre === 'procesador' && esProyector)) {
                            return (
                              <div key="horasNormales">
                                <label htmlFor="horasNormales" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  Horas normales {isCampoObligatorio('horasNormales') && '*'}
                                </label>
                                <input
                                  type="text"
                                  id="horasNormales"
                                  name="horasNormales"
                                  value={formData.horasNormales || ''}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('horasNormales')}
                                  placeholder="Ej: 1000h"
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                                />
                              </div>
                            );
                          }

                          // Renderizar horasEco
                          if (campoConfig.nombre === 'horasEco' || (campoConfig.nombre === 'ram' && esProyector)) {
                            return (
                              <div key="horasEco">
                                <label htmlFor="horasEco" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  Horas eco {isCampoObligatorio('horasEco') && '*'}
                                </label>
                                <input
                                  type="text"
                                  id="horasEco"
                                  name="horasEco"
                                  value={formData.horasEco || ''}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('horasEco')}
                                  placeholder="Ej: 500h"
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                                />
                              </div>
                            );
                          }

                          // Renderizar tipoConexion
                          if (campoConfig.nombre === 'tipoConexion' || (campoConfig.nombre === 'discoDuro' && esProyector)) {
                            return (
                              <div key="tipoConexion">
                                <label htmlFor="tipoConexion" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  Tipo de Conexión {isCampoObligatorio('tipoConexion') && '*'}
                                </label>
                                <select
                                  id="tipoConexion"
                                  name="tipoConexion"
                                  value={formData.tipoConexion || ''}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('tipoConexion')}
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} bg-white rounded-xl`}
                                >
                                  <option value="">Seleccione una conexión</option>
                                  <option value="HDMI">HDMI</option>
                                  <option value="VGA">VGA</option>
                                  <option value="Display Port">Display Port</option>
                                </select>
                              </div>
                            );
                          }
                        }

                        // Para otras categorías o secciones, mostrar campos normales
                        if (!esProyector || !esSeccionEspecificaciones) {
                          if (campoConfig.nombre === 'procesador') {
                            return (
                              <div key={campoConfig.nombre}>
                                <label htmlFor="procesador" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  {getCampoLabel('procesador', 'Procesador')} {isCampoObligatorio('procesador') && '*'}
                                </label>
                                <input
                                  type="text"
                                  id="procesador"
                                  name="procesador"
                                  value={formData.procesador}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('procesador')}
                                  placeholder="Ej: Intel Core i5-10400"
                                  className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                                />
                              </div>
                            );
                          }

                          if (campoConfig.nombre === 'ram') {
                            return (
                              <div key={campoConfig.nombre}>
                                <label htmlFor="ram" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  {getCampoLabel('ram', 'RAM')} {isCampoObligatorio('ram') && '*'}
                                </label>
                                <select
                                  id="ram"
                                  name="ram"
                                  value={formData.ram}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('ram')}
                                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-xl"
                                >
                                  <option value="">Seleccionar RAM</option>
                                  <option value="8GB">8GB</option>
                                  <option value="16GB">16GB</option>
                                  <option value="20GB">20GB</option>
                                  <option value="32GB">32GB</option>
                                </select>
                              </div>
                            );
                          }

                          if (campoConfig.nombre === 'discoDuro') {
                            return (
                              <div key={campoConfig.nombre}>
                                <label htmlFor="discoDuro" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  {getCampoLabel('discoDuro', 'Disco Duro')} {isCampoObligatorio('discoDuro') && '*'}
                                </label>
                                <select
                                  id="discoDuro"
                                  name="discoDuro"
                                  value={formData.discoDuro}
                                  onChange={handleChange}
                                  required={isCampoObligatorio('discoDuro')}
                                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-green-500 bg-white rounded-xl"
                                >
                                  <option value="">Seleccionar Disco Duro</option>
                                  <option value="256GB">256GB</option>
                                  <option value="512GB">500GB</option>
                                  <option value="1TB">1TB</option>
                                  <option value="1.5TB">1.5 TB</option>
                                </select>
                              </div>
                            );
                          }
                        }


                        // Para campos personalizados, usar renderCampoGenerico
                        return renderCampoGenerico(campoConfig);
                      })}

                      {/* Para Proyectores, agregar campos adicionales al final de Especificaciones Técnicas */}
                      {esProyector && esSeccionEspecificaciones && (
                        <>
                          {/* Mostrar marca si no está ya en la sección */}
                          {!camposSeccion.find(c => c.nombre === 'marca') && (
                            <div key="marca-proyector">
                              <label htmlFor="marca-proyector" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                Marca {isCampoObligatorio('marca') && '*'}
                              </label>
                              <input
                                type="text"
                                id="marca-proyector"
                                name="marca"
                                value={formData.marca}
                                onChange={handleChange}
                                required={isCampoObligatorio('marca')}
                                placeholder="Ej: Epson, BenQ, Optoma"
                                className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                              />
                            </div>
                          )}

                          {/* Mostrar numeroSerie si no está ya en la sección */}
                          {!camposSeccion.find(c => c.nombre === 'numeroSerie') && (
                            <div key="numeroSerie-proyector">
                              <label htmlFor="numeroSerie-proyector" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                Número de Serie {isCampoObligatorio('numeroSerie') && '*'}
                              </label>
                              <input
                                type="text"
                                id="numeroSerie-proyector"
                                name="numeroSerie"
                                value={formData.numeroSerie}
                                onChange={handleChange}
                                required={isCampoObligatorio('numeroSerie')}
                                placeholder="Ej: SN123456789"
                                className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                              />
                            </div>
                          )}

                          {/* Mostrar horasNormales */}
                          <div key="horasNormales-proyector">
                            <label htmlFor="horasNormales-proyector" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              Horas normales {isCampoObligatorio('horasNormales') && '*'}
                            </label>
                            <input
                              type="text"
                              id="horasNormales-proyector"
                              name="horasNormales"
                              value={formData.horasNormales || ''}
                              onChange={handleChange}
                              required={isCampoObligatorio('horasNormales')}
                              placeholder="Ej: 1000h"
                              className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                            />
                          </div>

                          {/* Mostrar horasEco */}
                          <div key="horasEco-proyector">
                            <label htmlFor="horasEco-proyector" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              Horas eco {isCampoObligatorio('horasEco') && '*'}
                            </label>
                            <input
                              type="text"
                              id="horasEco-proyector"
                              name="horasEco"
                              value={formData.horasEco || ''}
                              onChange={handleChange}
                              required={isCampoObligatorio('horasEco')}
                              placeholder="Ej: 500h"
                              className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} rounded-xl`}
                            />
                          </div>

                          {/* Mostrar tipoConexion */}
                          <div key="tipoConexion-proyector">
                            <label htmlFor="tipoConexion-proyector" className="block mb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              Tipo de Conexión {isCampoObligatorio('tipoConexion') && '*'}
                            </label>
                            <select
                              id="tipoConexion-proyector"
                              name="tipoConexion"
                              value={formData.tipoConexion || ''}
                              onChange={handleChange}
                              required={isCampoObligatorio('tipoConexion')}
                              className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:${INSTITUTIONAL_COLORS.borderPrimary} bg-white rounded-xl`}
                            >
                              <option value="">Seleccione una conexión</option>
                              <option value="HDMI">HDMI</option>
                              <option value="VGA">VGA</option>
                              <option value="Display Port">Display Port</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

          </form>
        </div>

        {/* ── FOOTER FIJO CON BOTONES ── */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl transition-all font-bold text-sm active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="item-form"
            className={`flex-2 flex-1 px-4 py-3 ${INSTITUTIONAL_COLORS.bgPrimary} text-white hover:bg-green-900 rounded-2xl transition-all font-black text-sm shadow-md shadow-green-100 active:scale-95`}
          >
            {item ? 'Actualizar Activo' : 'Guardar Activo'}
          </button>
        </div>
      </div>
    </div>
  );
}


