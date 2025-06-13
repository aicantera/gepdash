import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Save,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Theme {
  id_tema: number
  created_at: string
  nombre_tema: string
  desc_tema: string
  id_usuario: number
  activo?: boolean
  subtemas?: Subtheme[]
}

interface Subtheme {
  id_subtema: number
  created_at: string
  id_tema: number
  subtema_text: string
  subtema_desc: string
}

interface ThemeFormData {
  nombre_tema: string
  desc_tema: string
}

interface SubthemeFormData {
  subtema_text: string
  subtema_desc: string
}

const ThemeManagement: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [subtemas, setSubtemas] = useState<Subtheme[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Estados para modales
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showSubthemeModal, setShowSubthemeModal] = useState(false)
  const [modalType, setModalType] = useState<'create' | 'edit'>('create')
  
  // Estados para formularios
  const [themeFormData, setThemeFormData] = useState<ThemeFormData>({
    nombre_tema: '',
    desc_tema: ''
  })
  const [subthemeFormData, setSubthemeFormData] = useState<SubthemeFormData>({
    subtema_text: '',
    subtema_desc: ''
  })
  const [editingSubtheme, setEditingSubtheme] = useState<Subtheme | null>(null)
  
  // Estados para búsqueda y filtros
  const [subthemeSearch, setSubthemeSearch] = useState('')

  // Cargar temas
  const loadThemes = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Cargando temas principales...')
      
      const { data, error } = await supabase
        .from('temas')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const themesWithStatus = (data || []).map((theme) => ({
        ...theme,
        activo: (theme.id_tema % 3) !== 0
      }))
      
      setThemes(themesWithStatus)
      console.log('✅ Temas cargados:', themesWithStatus.length)
      
      // Si hay un tema seleccionado, recargar sus subtemas
      if (selectedTheme) {
        await loadSubthemes(selectedTheme.id_tema)
      }
      
    } catch (error) {
      console.error('❌ Error cargando temas:', error)
      setError('No se pudieron cargar los temas.')
    } finally {
      setLoading(false)
    }
  }

  // Cargar subtemas de un tema específico
  const loadSubthemes = async (themeId: number) => {
    try {
      console.log('🔄 Cargando subtemas para tema:', themeId)
      
      const { data, error } = await supabase
        .from('subtemas')
        .select('*')
        .eq('id_tema', themeId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      setSubtemas(data || [])
      console.log('✅ Subtemas cargados:', (data || []).length)
      
    } catch (error) {
      console.error('❌ Error cargando subtemas:', error)
      setError('No se pudieron cargar los subtemas.')
    }
  }

  // Manejar selección de tema
  const handleThemeSelect = async (theme: Theme) => {
    setSelectedTheme(theme)
    await loadSubthemes(theme.id_tema)
  }

  // Crear nuevo tema
  const createTheme = async () => {
    if (!themeFormData.nombre_tema.trim() || !themeFormData.desc_tema.trim()) {
      setError('Todos los campos son obligatorios.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('temas')
        .insert({
          nombre_tema: themeFormData.nombre_tema.trim(),
          desc_tema: themeFormData.desc_tema.trim(),
          id_usuario: 1
        })
        .select()
        .single()
      
      if (error) throw error
      
      setSuccessMessage('Tema creado correctamente.')
      setShowThemeModal(false)
      setThemeFormData({ nombre_tema: '', desc_tema: '' })
      await loadThemes()
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error creando tema:', error)
      setError('No se pudo crear el tema.')
    } finally {
      setLoading(false)
    }
  }

  // Crear nuevo subtema
  const createSubtheme = async () => {
    if (!selectedTheme) {
      setError('Selecciona un tema primero.')
      return
    }
    
    if (!subthemeFormData.subtema_text.trim() || !subthemeFormData.subtema_desc.trim()) {
      setError('Todos los campos del subtema son obligatorios.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('subtemas')
        .insert({
          id_tema: selectedTheme.id_tema,
          subtema_text: subthemeFormData.subtema_text.trim(),
          subtema_desc: subthemeFormData.subtema_desc.trim()
        })
      
      if (error) throw error
      
      setSuccessMessage('Subtema creado correctamente.')
      setShowSubthemeModal(false)
      setSubthemeFormData({ subtema_text: '', subtema_desc: '' })
      await loadSubthemes(selectedTheme.id_tema)
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error creando subtema:', error)
      setError('No se pudo crear el subtema.')
    } finally {
      setLoading(false)
    }
  }

  // Editar subtema
  const updateSubtheme = async () => {
    if (!editingSubtheme) return
    
    if (!subthemeFormData.subtema_text.trim() || !subthemeFormData.subtema_desc.trim()) {
      setError('Todos los campos del subtema son obligatorios.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('subtemas')
        .update({
          subtema_text: subthemeFormData.subtema_text.trim(),
          subtema_desc: subthemeFormData.subtema_desc.trim()
        })
        .eq('id_subtema', editingSubtheme.id_subtema)
      
      if (error) throw error
      
      setSuccessMessage('Subtema actualizado correctamente.')
      setShowSubthemeModal(false)
      setEditingSubtheme(null)
      setSubthemeFormData({ subtema_text: '', subtema_desc: '' })
      if (selectedTheme) {
        await loadSubthemes(selectedTheme.id_tema)
      }
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error actualizando subtema:', error)
      setError('No se pudo actualizar el subtema.')
    } finally {
      setLoading(false)
    }
  }

  // Eliminar subtema
  const deleteSubtheme = async (subtheme: Subtheme) => {
    if (!confirm(`¿Estás seguro de eliminar el subtema "${subtheme.subtema_text}"?`)) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('subtemas')
        .delete()
        .eq('id_subtema', subtheme.id_subtema)
      
      if (error) throw error
      
      setSuccessMessage('Subtema eliminado correctamente.')
      if (selectedTheme) {
        await loadSubthemes(selectedTheme.id_tema)
      }
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error eliminando subtema:', error)
      setError('No se pudo eliminar el subtema.')
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal para crear tema
  const openThemeModal = () => {
    setModalType('create')
    setThemeFormData({ nombre_tema: '', desc_tema: '' })
    setShowThemeModal(true)
    setError(null)
  }

  // Abrir modal para crear subtema
  const openSubthemeModal = () => {
    if (!selectedTheme) {
      setError('Selecciona un tema primero.')
      return
    }
    setModalType('create')
    setEditingSubtheme(null)
    setSubthemeFormData({ subtema_text: '', subtema_desc: '' })
    setShowSubthemeModal(true)
    setError(null)
  }

  // Abrir modal para editar subtema
  const openEditSubthemeModal = (subtheme: Subtheme) => {
    setModalType('edit')
    setEditingSubtheme(subtheme)
    setSubthemeFormData({
      subtema_text: subtheme.subtema_text,
      subtema_desc: subtheme.subtema_desc
    })
    setShowSubthemeModal(true)
    setError(null)
  }

  // Filtrar subtemas por búsqueda
  const filteredSubtemas = subtemas.filter(subtema =>
    subtema.subtema_text.toLowerCase().includes(subthemeSearch.toLowerCase()) ||
    subtema.subtema_desc.toLowerCase().includes(subthemeSearch.toLowerCase())
  )

  // Cargar datos iniciales
  useEffect(() => {
    loadThemes()
  }, [])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Temas y Subtemas</h1>
          <p className="text-gray-600 mt-1">
            Administra el catálogo semántico del sistema de extracción
          </p>
        </div>
        <button
          onClick={() => loadThemes()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Layout principal - Dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel izquierdo - Temas Principales */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Temas Principales</h2>
              <button
                onClick={openThemeModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus size={16} />
                Crear tema
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loading && themes.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando temas...</p>
              </div>
            ) : themes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No hay temas registrados.</p>
                <p className="text-gray-500 text-sm mt-2">Crea el primer tema para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {themes.map((theme) => (
                  <div
                    key={theme.id_tema}
                    onClick={() => handleThemeSelect(theme)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTheme?.id_tema === theme.id_tema
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {theme.nombre_tema}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {theme.desc_tema}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            theme.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {theme.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(theme.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Subtemas */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Subtemas</h2>
              <button
                onClick={openSubthemeModal}
                disabled={!selectedTheme}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Plus size={16} />
                Agregar subtema
              </button>
            </div>
            
            {selectedTheme && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Subtemas del tema: <span className="font-medium text-gray-900">{selectedTheme.nombre_tema}</span>
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar en tema padre..."
                    value={subthemeSearch}
                    onChange={(e) => setSubthemeSearch(e.target.value)}
                    className="form-input pl-10 w-full text-sm"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {!selectedTheme ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Selecciona un tema para ver sus subtemas</p>
              </div>
            ) : filteredSubtemas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {subthemeSearch 
                    ? 'No se encontraron subtemas que coincidan con la búsqueda.'
                    : 'Este tema no tiene subtemas.'
                  }
                </p>
                {!subthemeSearch && (
                  <p className="text-gray-500 text-sm mt-2">Agrega el primer subtema para comenzar.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubtemas.map((subtema) => (
                  <div
                    key={subtema.id_subtema}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {subtema.subtema_text}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {subtema.subtema_desc}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(subtema.created_at).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => openEditSubthemeModal(subtema)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar subtema"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => deleteSubtheme(subtema)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar subtema"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear/editar tema */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Crear Nuevo Tema
              </h3>
              <button
                onClick={() => setShowThemeModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Tema *
                  </label>
                  <input
                    type="text"
                    value={themeFormData.nombre_tema}
                    onChange={(e) => setThemeFormData(prev => ({ ...prev, nombre_tema: e.target.value }))}
                    className="form-input w-full"
                    placeholder="Ingresa el nombre del tema"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Tema *
                  </label>
                  <textarea
                    value={themeFormData.desc_tema}
                    onChange={(e) => setThemeFormData(prev => ({ ...prev, desc_tema: e.target.value }))}
                    rows={3}
                    className="form-input w-full resize-none"
                    placeholder="Describe el propósito y alcance del tema"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowThemeModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createTheme}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={16} />
                {loading ? 'Guardando...' : 'Crear Tema'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar subtema */}
      {showSubthemeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {modalType === 'create' ? 'Agregar Subtema' : 'Editar Subtema'}
              </h3>
              <button
                onClick={() => setShowSubthemeModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {selectedTheme && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <span className="font-medium">Tema padre:</span> {selectedTheme.nombre_tema}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Subtema *
                  </label>
                  <input
                    type="text"
                    value={subthemeFormData.subtema_text}
                    onChange={(e) => setSubthemeFormData(prev => ({ ...prev, subtema_text: e.target.value }))}
                    className="form-input w-full"
                    placeholder="Ingresa el nombre del subtema"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Subtema *
                  </label>
                  <textarea
                    value={subthemeFormData.subtema_desc}
                    onChange={(e) => setSubthemeFormData(prev => ({ ...prev, subtema_desc: e.target.value }))}
                    rows={3}
                    className="form-input w-full resize-none"
                    placeholder="Describe el propósito del subtema"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowSubthemeModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={modalType === 'create' ? createSubtheme : updateSubtheme}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={16} />
                {loading ? 'Guardando...' : modalType === 'create' ? 'Crear Subtema' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeManagement 