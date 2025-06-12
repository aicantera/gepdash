import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  X,
  Save,
  RefreshCw,
  Building,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// Interfaces para temas y subtemas
interface Tema {
  id_tema: number
  created_at?: string
  nombre_tema: string
  desc_tema?: string
  id_usuario?: number
}

interface Subtema {
  id_subtema: number
  created_at?: string
  id_tema: number
  subtema_text: string
  subtema_desc?: string
}

interface Client {
  id: string
  empresa_admin: number | null
  nombre_contacto: string
  cargo: string | null
  email: string
  telefono: string | null
  temas_suscrit: string[] | null
  estado: string
  creado_en: string
  activo?: boolean
}

interface Empresa {
  id_empresa: number
  created_at?: string
  id_usuario?: number
  nombre_em: string
  rfc?: string
  giro?: string
  sitio_web?: string
}

interface ClientFormData {
  empresa_admin: number | null
  nombre_contacto: string
  cargo: string
  email: string
  telefono: string
  temas_suscrit: string[]
  estado: string
}

const ClientsManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [temas, setTemas] = useState<Tema[]>([])
  const [subtemas, setSubtemas] = useState<Subtema[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'delete'>('create')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  
  // Estados para formulario
  const [formData, setFormData] = useState<ClientFormData>({
    empresa_admin: null,
    nombre_contacto: '',
    cargo: '',
    email: '',
    telefono: '',
    temas_suscrit: [],
    estado: 'activo'
  })
  
  const ITEMS_PER_PAGE = 10

  // Add estado mapping and debug button
  const [showDebug, setShowDebug] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadEmpresas()
    loadTemas()
    loadSubtemas()
    loadClients()
  }, [])

  // Cargar clientes cuando cambian los filtros
  useEffect(() => {
    loadClients()
  }, [currentPage, searchTerm])

  const loadEmpresas = async () => {
    try {
      console.log('🔄 Cargando empresas...')
      
      const { data, error } = await supabase
        .from('empresas')
        .select('id_empresa, nombre_em')
        .order('nombre_em')
      
      if (error) {
        console.error('❌ Error cargando empresas:', error)
        throw error
      }
      
      console.log('✅ Empresas cargadas:', data?.length || 0, data)
      setEmpresas(data || [])
      
      if (data && data.length > 0) {
        console.log('📋 Primera empresa cargada:', data[0])
      }
    } catch (error) {
      console.error('❌ Error final cargando empresas:', error)
      setError('No se pudieron cargar las empresas. Verifica la conexión a la base de datos.')
    }
  }

  const loadTemas = async () => {
    try {
      console.log('🔄 Cargando temas...')
      
      const { data, error } = await supabase
        .from('temas')
        .select('*')
        .order('nombre_tema')
      
      if (error) {
        console.error('❌ Error cargando temas:', error)
        throw error
      }
      
      console.log('✅ Temas cargados:', data?.length || 0, data)
      setTemas(data || [])
    } catch (error) {
      console.error('❌ Error final cargando temas:', error)
      // Don't show error to user if themes fail, just log it
    }
  }

  const loadSubtemas = async () => {
    try {
      console.log('🔄 Cargando subtemas...')
      
      const { data, error } = await supabase
        .from('subtemas')
        .select('*')
        .order('subtema_text')
      
      if (error) {
        console.error('❌ Error cargando subtemas:', error)
        throw error
      }
      
      console.log('✅ Subtemas cargados:', data?.length || 0, data)
      setSubtemas(data || [])
    } catch (error) {
      console.error('❌ Error final cargando subtemas:', error)
      // Don't show error to user if themes fail, just log it
    }
  }

  const loadClients = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
      
      // Aplicar búsqueda
      if (searchTerm.trim()) {
        const searchPattern = `%${searchTerm.trim().toLowerCase()}%`
        query = query.or(`nombre_contacto.ilike.${searchPattern},email.ilike.${searchPattern},cargo.ilike.${searchPattern}`)
      }
      
      // Obtener conteo total
      const { count } = await query
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE))
      
      // Obtener datos paginados
      const { data, error } = await query
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
        .order('creado_en', { ascending: false })
      
      if (error) throw error
      
      setClients(data || [])
    } catch (error) {
      console.error('Error cargando clientes:', error)
      setError('No se pudieron cargar los clientes.')
    } finally {
      setLoading(false)
    }
  }

  // Validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validar formulario
  const validateForm = (): string | null => {
    if (!formData.empresa_admin) {
      return 'Debes seleccionar una empresa.'
    }
    
    if (!formData.nombre_contacto.trim()) {
      return 'El nombre del cliente es obligatorio.'
    }
    
    if (!formData.email.trim()) {
      return 'El email es obligatorio.'
    }
    
    if (!isValidEmail(formData.email)) {
      return 'El formato del email no es válido.'
    }
    
    if (!formData.estado) {
      return 'Debes seleccionar un estado para el cliente.'
    }
    
    return null
  }

  // Verificar nombre duplicado
  const checkDuplicateName = async (nombre: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .ilike('nombre_contacto', nombre)
        .neq('id', selectedClient?.id || '')
      
      if (error) throw error
      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Error verificando duplicados:', error)
      return false
    }
  }

  // Guardar cliente
  const saveClient = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Verificar nombre duplicado
      const isDuplicate = await checkDuplicateName(formData.nombre_contacto)
      if (isDuplicate) {
        setError('Ya existe un cliente con ese nombre. Por favor utiliza un nombre distinto.')
        setLoading(false)
        return
      }
      
      if (modalType === 'create') {
        console.log('🔄 Intentando crear cliente con datos:', {
          empresa_admin: formData.empresa_admin,
          nombre_contacto: formData.nombre_contacto.trim(),
          cargo: formData.cargo.trim() || null,
          email: formData.email.trim(),
          telefono: formData.telefono.trim() || null,
          estado: 'activo'
        })
        
        const { data, error } = await supabase
          .from('clientes')
          .insert({
            empresa_admin: formData.empresa_admin,
            nombre_contacto: formData.nombre_contacto.trim(),
            cargo: formData.cargo.trim() || null,
            email: formData.email.trim(),
            telefono: formData.telefono.trim() || null,
            temas_suscrit: formData.temas_suscrit.length > 0 ? formData.temas_suscrit : null,
            estado: formData.estado
          })
          .select()
        
        console.log('📊 Resultado inserción:', { data, error })
        
        if (error) {
          console.error('❌ Error detallado al crear cliente:', error)
          throw error
        }
        
        setSuccessMessage('Cliente registrado exitosamente.')
      } else if (modalType === 'edit' && selectedClient) {
        console.log('🔄 Intentando actualizar cliente:', selectedClient.id)
        
        const { data, error } = await supabase
          .from('clientes')
          .update({
            empresa_admin: formData.empresa_admin,
            nombre_contacto: formData.nombre_contacto.trim(),
            cargo: formData.cargo.trim() || null,
            email: formData.email.trim(),
            telefono: formData.telefono.trim() || null,
            temas_suscrit: formData.temas_suscrit.length > 0 ? formData.temas_suscrit : null,
            estado: formData.estado
          })
          .eq('id', selectedClient.id)
          .select()
        
        console.log('📊 Resultado actualización:', { data, error })
        
        if (error) {
          console.error('❌ Error detallado al actualizar cliente:', error)
          throw error
        }
        
        setSuccessMessage('Datos del cliente actualizados correctamente.')
      }
      
      closeModal()
      await loadClients()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('❌ Error guardando cliente:', error)
      
      // Manejar errores específicos de Supabase
      if (error?.code === 'PGRST301') {
        setError('Error de autenticación. Verifica que tengas permisos para crear clientes.')
      } else if (error?.code === '23505') {
        setError('Ya existe un cliente con esos datos. Verifica la información e intenta nuevamente.')
      } else if (error?.code === '23503') {
        setError('La empresa seleccionada no es válida. Selecciona una empresa existente.')
      } else if (error?.message) {
        setError(`Error: ${error.message}`)
      } else {
        setError('Ocurrió un error al registrar el cliente. Intenta nuevamente más tarde.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Eliminar cliente
  const deleteClient = async () => {
    if (!selectedClient) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', selectedClient.id)
      
      if (error) throw error
      
      setSuccessMessage('Cliente eliminado correctamente.')
      closeModal()
      await loadClients()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error eliminando cliente:', error)
      setError('No se pudo eliminar el cliente. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // Cambiar estado del cliente
  const toggleClientStatus = async (client: Client) => {
    setLoading(true)
    
    try {
      const newStatus = client.estado === 'activo' ? 'inactivo' : 'activo'
      const { error } = await supabase
        .from('clientes')
        .update({ estado: newStatus })
        .eq('id', client.id)
      
      if (error) throw error
      
      const message = newStatus === 'activo' 
        ? 'El cliente ha sido activado. Se reanudará el envío de alertas.'
        : 'El cliente ha sido desactivado. No recibirá nuevas alertas.'
      
      setSuccessMessage(message)
      await loadClients()
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      console.error('Error cambiando estado:', error)
      setError('No se pudo actualizar el estado del cliente. Intenta nuevamente.')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal
  const openModal = (type: typeof modalType, client?: Client) => {
    setModalType(type)
    setSelectedClient(client || null)
    setError(null)
    
    if (type === 'create') {
      setFormData({
        empresa_admin: null,
        nombre_contacto: '',
        cargo: '',
        email: '',
        telefono: '',
        temas_suscrit: [],
        estado: 'activo'
      })
    } else if (client && (type === 'edit' || type === 'view')) {
      setFormData({
        empresa_admin: client.empresa_admin,
        nombre_contacto: client.nombre_contacto,
        cargo: client.cargo || '',
        email: client.email,
        telefono: client.telefono || '',
        temas_suscrit: client.temas_suscrit || [],
        estado: client.estado
      })
    }
    
    setShowModal(true)
  }

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedClient(null)
    setError(null)
  }

  // Manejar búsqueda
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      client.nombre_contacto.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.cargo?.toLowerCase().includes(searchLower) ||
      client.temas_suscrit?.some(tema => tema.toLowerCase().includes(searchLower))
    )
  })

  // Debug function
  const testConnections = async () => {
    console.log('🔧 PRUEBA DE CONEXIONES')
    
    console.log('1. Probando conexión a empresas...')
    try {
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('*')
        .limit(5)
      
      console.log('✅ Empresas:', { data: empresasData, error: empresasError })
    } catch (e) {
      console.error('❌ Error empresas:', e)
    }
    
    console.log('2. Probando conexión a temas...')
    try {
      const { data: temasData, error: temasError } = await supabase
        .from('temas')
        .select('*')
        .limit(10)
      
      console.log('✅ Temas:', { data: temasData, error: temasError })
    } catch (e) {
      console.error('❌ Error temas:', e)
    }
    
    console.log('3. Probando conexión a subtemas...')
    try {
      const { data: subtemasData, error: subtemasError } = await supabase
        .from('subtemas')
        .select('*')
        .limit(10)
      
      console.log('✅ Subtemas:', { data: subtemasData, error: subtemasError })
    } catch (e) {
      console.error('❌ Error subtemas:', e)
    }
    
    console.log('4. Probando conexión a clientes...')
    try {
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .limit(5)
      
      console.log('✅ Clientes:', { data: clientesData, error: clientesError })
    } catch (e) {
      console.error('❌ Error clientes:', e)
    }
    
    console.log('5. Estado actual:')
    console.log('- Empresas cargadas:', empresas.length)
    console.log('- Temas cargados:', temas.length)
    console.log('- Subtemas cargados:', subtemas.length)
    console.log('- Clientes cargados:', clients.length)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lista de Clientes (Contactados)</h1>
          <p className="text-gray-600 mt-1">
            Administra los clientes y sus configuraciones de alertas temáticas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadEmpresas()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
          >
            <Building size={14} />
            Empresas ({empresas.length})
          </button>
          <button
            onClick={() => loadClients()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => openModal('create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Debug section - Add this after the header */}
      <div className="mb-4">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          🔧 Debug
        </button>
        {showDebug && (
          <div className="mt-2 p-3 bg-gray-50 rounded border text-sm">
            <div className="flex gap-2 mb-2">
              <button
                onClick={testConnections}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Probar Conexiones
              </button>
              <button
                onClick={loadEmpresas}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs"
              >
                Recargar Empresas
              </button>
                             <button
                 onClick={loadClients}
                 className="px-3 py-1 bg-orange-500 text-white rounded text-xs"
               >
                 Recargar Clientes
               </button>
               <button
                 onClick={loadTemas}
                 className="px-3 py-1 bg-purple-500 text-white rounded text-xs"
               >
                 Recargar Temas
               </button>
               <button
                 onClick={loadSubtemas}
                 className="px-3 py-1 bg-indigo-500 text-white rounded text-xs"
               >
                 Recargar Subtemas
               </button>
             </div>
             <div className="text-xs text-gray-600">
               <div>📊 Empresas: {empresas.length}</div>
               <div>🎯 Temas: {temas.length}</div>
               <div>📋 Subtemas: {subtemas.length}</div>
               <div>👥 Clientes: {clients.length}</div>
               <div>🔧 Abre la consola (F12) para ver detalles</div>
             </div>
          </div>
        )}
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

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email, cargo o temas..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="form-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">
              {searchTerm 
                ? 'No se encontraron clientes que coincidan con tu búsqueda.'
                : 'No hay clientes registrados. Registra el primer cliente para comenzar.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Building className="w-8 h-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {client.nombre_contacto}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.cargo || 'Sin cargo especificado'}
                            </div>
                            <div className="text-xs text-blue-600">
                              {empresas.find(emp => emp.id_empresa === client.empresa_admin)?.nombre_em || 'Empresa no encontrada'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{client.email}</div>
                        {client.telefono && (
                          <div className="text-sm text-gray-500">{client.telefono}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(client.creado_en).toLocaleDateString('es-MX')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                          client.estado === 'activo' 
                            ? 'bg-green-100 text-green-800' 
                            : client.estado === 'pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal('view', client)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openModal('edit', client)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Editar cliente"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => toggleClientStatus(client)}
                            className={`p-2 rounded-lg transition-colors ${
                              client.estado === 'activo'
                                ? 'text-orange-600 hover:bg-orange-100'
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={client.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          >
                            {client.estado === 'activo' ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                          <button
                            onClick={() => openModal('delete', client)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Eliminar cliente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {modalType === 'create' && 'Nuevo Cliente'}
                {modalType === 'edit' && 'Editar Cliente'}
                {modalType === 'view' && 'Ver Detalles del Cliente'}
                {modalType === 'delete' && 'Confirmar Eliminación'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-4">
              {modalType === 'delete' ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    ¿Estás seguro?
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Esta acción eliminará permanentemente al cliente "{selectedClient?.nombre_contacto}" 
                    y todas sus configuraciones asociadas. Esta acción no se puede deshacer.
                  </p>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={deleteClient}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Eliminando...' : 'Eliminar Cliente'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Información básica del cliente */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Información del Cliente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Empresa Admin *
                        </label>
                        <select
                          value={formData.empresa_admin || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, empresa_admin: e.target.value ? parseInt(e.target.value) : null }))}
                          disabled={modalType === 'view'}
                          className="form-input w-full"
                        >
                          <option value="">
                            {empresas.length === 0 
                              ? 'Cargando empresas...' 
                              : 'Selecciona una empresa'
                            }
                          </option>
                          {empresas.map(empresa => (
                            <option key={empresa.id_empresa} value={empresa.id_empresa}>
                              {empresa.nombre_em}
                            </option>
                          ))}
                        </select>
                        {empresas.length === 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ No se cargaron empresas. Revisa la consola del navegador.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Contacto *
                        </label>
                        <input
                          type="text"
                          value={formData.nombre_contacto}
                          onChange={(e) => setFormData(prev => ({ ...prev, nombre_contacto: e.target.value }))}
                          disabled={modalType === 'view'}
                          className="form-input w-full"
                          placeholder="Nombre de la persona de contacto"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cargo
                        </label>
                        <input
                          type="text"
                          value={formData.cargo}
                          onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                          disabled={modalType === 'view'}
                          className="form-input w-full"
                          placeholder="Cargo del contacto"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={modalType === 'view'}
                          className="form-input w-full"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                          disabled={modalType === 'view'}
                          className="form-input w-full"
                          placeholder="(55) 1234-5678"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Temas Suscritos
                        </label>
                        {temas.length === 0 ? (
                          <div className="text-sm text-gray-500">
                            Cargando temas desde la base de datos...
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {temas.map((tema) => {
                              const temaSubtemas = subtemas.filter(s => s.id_tema === tema.id_tema)
                              return (
                                <div key={tema.id_tema} className="border border-gray-200 rounded-lg p-3">
                                  <h5 className="font-medium text-gray-800 text-sm mb-2">{tema.nombre_tema}</h5>
                                  <div className="space-y-1">
                                    {temaSubtemas.map((subtema) => (
                                      <label key={subtema.id_subtema} className="flex items-center text-sm">
                                        <input
                                          type="checkbox"
                                          checked={formData.temas_suscrit.includes(subtema.subtema_text)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setFormData(prev => ({
                                                ...prev,
                                                temas_suscrit: [...prev.temas_suscrit, subtema.subtema_text]
                                              }))
                                            } else {
                                              setFormData(prev => ({
                                                ...prev,
                                                temas_suscrit: prev.temas_suscrit.filter(t => t !== subtema.subtema_text)
                                              }))
                                            }
                                          }}
                                          disabled={modalType === 'view'}
                                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">{subtema.subtema_text}</span>
                                      </label>
                                    ))}
                                    {temaSubtemas.length === 0 && (
                                      <div className="text-xs text-gray-400">
                                        No hay subtemas disponibles
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {formData.temas_suscrit.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Seleccionados:</strong> {formData.temas_suscrit.join(', ')}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado *
                        </label>
                        <select
                          value={formData.estado}
                          onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                          disabled={modalType === 'view'}
                          className="form-input w-full"
                        >
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                          <option value="pendiente">Pendiente</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional para vista */}
                  {modalType === 'view' && selectedClient && (
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">
                        Información Adicional
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Empresa:</span>
                          <div className="font-medium">
                            {empresas.find(emp => emp.id_empresa === selectedClient.empresa_admin)?.nombre_em || 'No asignada'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Fecha de registro:</span>
                          <div className="font-medium">
                            {new Date(selectedClient.creado_en).toLocaleDateString('es-MX')}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-600">Temas Suscritos:</span>
                          <div className="font-medium">
                            {selectedClient.temas_suscrit && selectedClient.temas_suscrit.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedClient.temas_suscrit.map((tema: string, index: number) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {tema}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              'No especificados'
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Estado:</span>
                          <div className={`font-medium capitalize ${
                            selectedClient.estado === 'activo' ? 'text-green-600' : 
                            selectedClient.estado === 'pendiente' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedClient.estado}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer del modal */}
            {modalType !== 'delete' && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {modalType === 'view' ? 'Cerrar' : 'Cancelar'}
                </button>
                {modalType !== 'view' && (
                  <button
                    onClick={saveClient}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save size={16} />
                    {loading ? 'Guardando...' : 'Guardar Cliente'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientsManagement 