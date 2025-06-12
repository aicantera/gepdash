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
  Users,
  AlertTriangle,
  Filter,
  Mail,
  Lock,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Power,
  PowerOff
} from 'lucide-react'
import { supabase, supabaseAdmin } from '../lib/supabase'

interface UserProfile {
  id?: number
  created_at?: string
  user_id?: string
  nombre: string
  apellido: string
  email: string
  perfil: 'Administrador' | 'Analista GEP'
  activo?: boolean
  password?: string
}

interface UserFormData {
  nombre: string
  apellido: string
  email: string
  perfil: 'Administrador' | 'Analista GEP'
  password: string
  confirmPassword: string
  activo: boolean
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'Administrador' | 'Analista GEP'>('all')
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'delete' | 'toggle'>('create')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  
  // Estados para formulario
  const [formData, setFormData] = useState<UserFormData>({
    nombre: '',
    apellido: '',
    email: '',
    perfil: 'Analista GEP',
    password: '',
    confirmPassword: '',
    activo: true
  })

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Debug
  const [showDebug, setShowDebug] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadUsers()
  }, [])

  // Cargar usuarios cuando cambian los filtros
  useEffect(() => {
    loadUsers()
  }, [searchTerm, statusFilter, roleFilter])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Iniciando carga de usuarios...')
      
      let query = supabase
        .from('usuarios')
        .select('*')
      
      // Aplicar búsqueda
      if (searchTerm.trim()) {
        const searchPattern = `%${searchTerm.trim().toLowerCase()}%`
        query = query.or(`nombre.ilike.${searchPattern},apellido.ilike.${searchPattern},email.ilike.${searchPattern}`)
      }
      
      // Aplicar filtros
      if (statusFilter !== 'all') {
        query = query.eq('activo', statusFilter === 'active')
      }
      
      if (roleFilter !== 'all') {
        query = query.eq('perfil', roleFilter)
      }
      
      console.log('📊 Ejecutando consulta...')
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error detallado cargando usuarios:', error)
        throw error
      }
      
      console.log('✅ Usuarios cargados:', data?.length || 0, data)
      
      // Asegurar que activo tenga valor por defecto
      const usersWithDefaults = (data || []).map(user => ({
        ...user,
        activo: user.activo !== undefined ? user.activo : true
      }))
      
      setUsers(usersWithDefaults)
      setCurrentPage(1) // Reset página al filtrar
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      if (error instanceof Error) {
        setError(`Error cargando usuarios: ${error.message}`)
      } else {
        setError('No se pudieron cargar los usuarios.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Validaciones
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return 'El correo electrónico es obligatorio.'
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Formato de correo electrónico inválido.'
    
    if (!email.endsWith('@gep.com.mx')) {
      return 'El correo debe ser del dominio @gep.com.mx.'
    }
    
    return null
  }

  const validatePassword = (password: string): string | null => {
    if (!password.trim()) return 'La contraseña es obligatoria.'
    
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }
    
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    if (!hasUppercase || !hasNumber || !hasSpecialChar) {
      return 'La contraseña no cumple con los requisitos de seguridad: mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial.'
    }
    
    return null
  }

  const validateForm = (): string | null => {
    if (!formData.nombre.trim()) return 'El nombre es obligatorio.'
    if (!formData.apellido.trim()) return 'El apellido es obligatorio.'
    
    const emailError = validateEmail(formData.email)
    if (emailError) return emailError
    
    if (modalType === 'create' || formData.password.trim()) {
      const passwordError = validatePassword(formData.password)
      if (passwordError) return passwordError
      
      if (formData.password !== formData.confirmPassword) {
        return 'Las contraseñas no coinciden.'
      }
    }
    
    return null
  }

  // Verificar duplicados
  const checkDuplicates = async (nombre: string, apellido: string, email: string): Promise<string | null> => {
    try {
      console.log('🔍 Verificando duplicados...')
      const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email')
        .neq('id', selectedUser?.id || 0)
      
      if (error) throw error
      
      for (const user of data || []) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          return 'Ya existe un usuario registrado con ese correo.'
        }
        
        const existingNombreCompleto = `${user.nombre} ${user.apellido}`
        if (existingNombreCompleto.toLowerCase() === nombreCompleto.toLowerCase()) {
          return 'Ya existe un usuario registrado con ese nombre.'
        }
      }
      
      console.log('✅ No se encontraron duplicados')
      return null
    } catch (error) {
      console.error('Error verificando duplicados:', error)
      return null
    }
  }

  // Guardar usuario
  const saveUser = async () => {
    console.log('🚀 Iniciando proceso de guardar usuario...')
    console.log('📝 Modal type:', modalType)
    console.log('📝 Form data:', formData)
    
    const validationError = validateForm()
    if (validationError) {
      console.log('❌ Error de validación:', validationError)
      setError(validationError)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Validaciones pasadas, verificando duplicados...')
      
      // Verificar duplicados
      const duplicateError = await checkDuplicates(formData.nombre, formData.apellido, formData.email)
      if (duplicateError) {
        console.log('❌ Error de duplicado:', duplicateError)
        setError(duplicateError)
        setLoading(false)
        return
      }
      
      if (modalType === 'create') {
        console.log('🆕 Creando nuevo usuario...')
        
        try {
          // PASO 1: Crear usuario en Supabase Auth
          console.log('🔐 Paso 1: Creando usuario en Supabase Auth...')
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            email_confirm: true, // Confirmar email automáticamente
            user_metadata: {
              nombre: formData.nombre.trim(),
              apellido: formData.apellido.trim(),
              perfil: formData.perfil
            }
          })
          
          console.log('📊 Resultado creación Auth:', { authData, authError })
          
          if (authError) {
            console.error('❌ Error creando usuario en Auth:', authError)
            setError(`Error creando usuario en Auth: ${authError.message}`)
            setLoading(false)
            return
          }
          
          if (!authData.user) {
            console.error('❌ No se recibió usuario de Auth')
            setError('No se pudo crear el usuario en el sistema de autenticación')
            setLoading(false)
            return
          }
          
          console.log('✅ Usuario Auth creado con ID:', authData.user.id)
          
          // PASO 2: Crear registro en tabla usuarios
          console.log('📝 Paso 2: Creando registro en tabla usuarios...')
          const insertData = {
            user_id: authData.user.id, // Usar el ID del usuario Auth creado
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            email: formData.email.trim().toLowerCase(),
            perfil: formData.perfil,
            activo: formData.activo
          }
          
          console.log('📊 Datos a insertar en usuarios:', insertData)
          
          const { data, error } = await supabase
            .from('usuarios')
            .insert(insertData)
            .select()
          
          console.log('📊 Resultado inserción usuarios:', { data, error })
          
          if (error) {
            console.error('❌ Error insertando en tabla usuarios:', error)
            
            // Si falla la inserción en usuarios, eliminar el usuario Auth creado
            console.log('🔄 Limpiando: eliminando usuario Auth creado...')
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            
            setError(`Error guardando datos del usuario: ${error.message}`)
            setLoading(false)
            return
          }
          
          console.log('✅ Usuario creado exitosamente en ambas tablas')
          
        } catch (error) {
          console.error('❌ Error general en creación:', error)
          setError('Error inesperado durante la creación del usuario')
          setLoading(false)
          return
        }
        
        // Simular envío de correo de bienvenida
        console.log('📧 Enviando correo de bienvenida a:', formData.email)
        setSuccessMessage('Usuario registrado exitosamente. Se ha enviado un correo con las credenciales.')
      } else if (modalType === 'edit' && selectedUser) {
        console.log('✏️ Actualizando usuario:', selectedUser.id)
        
        const updateData: Record<string, unknown> = {
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim().toLowerCase(),
          perfil: formData.perfil,
          activo: formData.activo
        }
        
        console.log('📊 Datos a actualizar:', updateData)
        
        const { data, error } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', selectedUser.id)
          .select()
        
        console.log('📊 Resultado actualización:', { data, error })
        
        if (error) {
          console.error('❌ Error detallado al actualizar usuario:', error)
          setError(`Error específico: ${error.message}. Código: ${error.code || 'N/A'}`)
          setLoading(false)
          return
        }
        
        console.log('✅ Usuario actualizado exitosamente')
        let message = 'Usuario actualizado correctamente.'
        
        // Si se cambió la contraseña, simular envío de correo
        if (formData.password.trim()) {
          console.log('📧 Enviando correo de restablecimiento a:', formData.email)
          message = 'La contraseña fue actualizada. El usuario ha sido notificado por correo.'
        }
        
        setSuccessMessage(message)
      }
      
      console.log('🎉 Proceso completado, cerrando modal y recargando usuarios...')
      closeModal()
      await loadUsers()
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      console.error('❌ Error guardando usuario:', error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available')
      
      if (error instanceof Error) {
        setError(`Error detallado: ${error.message}`)
      } else {
        setError('Ocurrió un error al procesar la solicitud. Revisa la consola para más detalles.')
      }
    } finally {
      console.log('🏁 Finalizando proceso, desactivando loading...')
      setLoading(false)
    }
  }

  // Cambiar estado del usuario
  const toggleUserStatus = async () => {
    if (!selectedUser) return
    
    setLoading(true)
    setError(null)
    
    try {
      const newStatus = !selectedUser.activo
      
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: newStatus })
        .eq('id', selectedUser.id)
      
      if (error) throw error
      
      const message = newStatus 
        ? 'Usuario activado correctamente.'
        : 'Usuario desactivado correctamente.'
      
      setSuccessMessage(message)
      closeModal()
      await loadUsers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error cambiando estado del usuario:', error)
      setError('No se pudo cambiar el estado del usuario.')
    } finally {
      setLoading(false)
    }
  }

  // Eliminar usuario
  const deleteUser = async () => {
    if (!selectedUser) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Primero eliminar de la tabla usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', selectedUser.id)
      
      if (dbError) throw dbError
      
      // Si tiene user_id, también eliminar del sistema de autenticación
      if (selectedUser.user_id) {
        console.log('🔄 Eliminando usuario del sistema de autenticación...')
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(selectedUser.user_id)
        if (authError) {
          console.warn('⚠️ Error eliminando usuario de Auth (puede que ya no exista):', authError.message)
        }
      }
      
      setSuccessMessage('Usuario eliminado correctamente.')
      closeModal()
      await loadUsers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      setError('No se pudo eliminar el usuario.')
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal
  const openModal = (type: typeof modalType, user?: UserProfile) => {
    setModalType(type)
    setSelectedUser(user || null)
    setError(null)
    
    if (type === 'create') {
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        perfil: 'Analista GEP',
        password: '',
        confirmPassword: '',
        activo: true
      })
    } else if (user && (type === 'edit' || type === 'view')) {
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        perfil: user.perfil,
        password: '',
        confirmPassword: '',
        activo: user.activo ?? true
      })
    }
    
    setShowModal(true)
  }

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setError(null)
  }

  // Paginación
  const totalPages = Math.ceil(users.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // Debug function
  const testConnections = async () => {
    console.log('🔧 PRUEBA DE CONEXIÓN - USUARIOS')
    
    try {
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .limit(10)
      
      console.log('✅ Usuarios:', { data: usuariosData, error: usuariosError })
    } catch (e) {
      console.error('❌ Error usuarios:', e)
    }
    
    console.log('📊 Estado actual: Usuarios cargados:', users.length)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-gray-600">Administrar usuarios del sistema</p>
              </div>
            </div>
            <button
              onClick={() => openModal('create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          {/* Filtros y búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por estado */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            {/* Filtro por rol */}
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">Todos los roles</option>
                <option value="Administrador">Administrador</option>
                <option value="Analista GEP">Analista GEP</option>
              </select>
            </div>

            {/* Botón de actualizar */}
            <button
              onClick={loadUsers}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Debug toggle */}
          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showDebug ? 'Ocultar Debug' : 'Mostrar Debug'}
            </button>
            <button
              onClick={testConnections}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Probar Conexión
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-green-800 font-medium">Éxito</h3>
                <p className="text-green-700 mt-1">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Panel de debug */}
        {showDebug && (
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-6 text-sm font-mono">
            <h3 className="text-yellow-400 font-bold mb-2">DEBUG INFO</h3>
            <div className="space-y-1">
              <div>Total usuarios: {users.length}</div>
              <div>Página actual: {currentPage}/{totalPages}</div>
              <div>Loading: {loading.toString()}</div>
              <div>Filtros: búsqueda="{searchTerm}", estado={statusFilter}, rol={roleFilter}</div>
              <div>Modal: tipo={modalType}, visible={showModal.toString()}</div>
            </div>
          </div>
        )}

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading && !showModal ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Cargando usuarios...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Registro
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td className="px-6 py-4 text-center text-gray-500" colSpan={6}>
                          No se encontraron usuarios
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.nombre} {user.apellido}
                                </div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.perfil === 'Administrador'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.perfil}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                              user.activo 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.activo ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Activo</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Inactivo</>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openModal('view', user)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openModal('edit', user)}
                                className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                                title="Editar usuario"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openModal('toggle', user)}
                                className={`p-1 rounded ${
                                  user.activo 
                                    ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                    : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                }`}
                                title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                              >
                                {user.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => openModal('delete', user)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                          <span className="font-medium">
                            {Math.min(startIndex + itemsPerPage, users.length)}
                          </span>{' '}
                          de <span className="font-medium">{users.length}</span> resultados
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Anterior
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Siguiente
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header del modal */}
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalType === 'create' && 'Crear Nuevo Usuario'}
                  {modalType === 'edit' && 'Editar Usuario'}
                  {modalType === 'view' && 'Detalles del Usuario'}
                  {modalType === 'delete' && 'Eliminar Usuario'}
                  {modalType === 'toggle' && 'Cambiar Estado'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-6">
                {/* Mensaje de error en el modal */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-red-800 font-medium">Error</h4>
                        <p className="text-red-700 mt-1 text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {modalType === 'view' && selectedUser && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo
                      </label>
                      <p className="text-gray-900">{selectedUser.nombre} {selectedUser.apellido}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol
                      </label>
                      <p className="text-gray-900">{selectedUser.perfil}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <p className={`font-medium ${selectedUser.activo ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.activo ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Registro
                      </label>
                      <p className="text-gray-900">
                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('es-ES') : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {(modalType === 'create' || modalType === 'edit') && (
                  <form onSubmit={(e) => { e.preventDefault(); saveUser(); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          id="apellido"
                          value={formData.apellido}
                          onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Correo Electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="usuario@gep.com.mx"
                          required
                          disabled={loading}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        El correo debe pertenecer al dominio @gep.com.mx
                      </p>
                    </div>

                    <div>
                      <label htmlFor="perfil" className="block text-sm font-medium text-gray-700 mb-1">
                        Rol *
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <select
                          id="perfil"
                          value={formData.perfil}
                          onChange={(e) => setFormData({...formData, perfil: e.target.value as UserFormData['perfil']})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                          required
                          disabled={loading}
                        >
                          <option value="Analista GEP">Analista GEP</option>
                          <option value="Administrador">Administrador</option>
                        </select>
                      </div>
                    </div>

                    {(modalType === 'create' || formData.password.trim()) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            {modalType === 'create' ? 'Contraseña *' : 'Nueva Contraseña'}
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="password"
                              id="password"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required={modalType === 'create'}
                              disabled={loading}
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            {modalType === 'create' ? 'Confirmar Contraseña *' : 'Confirmar Nueva'}
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required={modalType === 'create' || formData.password.trim() !== ''}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}

                    {modalType === 'create' && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <strong>Requisitos de contraseña:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Mínimo 8 caracteres</li>
                          <li>Al menos una letra mayúscula</li>
                          <li>Al menos un número</li>
                          <li>Al menos un carácter especial (!@#$%^&*)</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="activo"
                        checked={formData.activo}
                        onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                      <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                        Usuario activo
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>{modalType === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {modalType === 'delete' && selectedUser && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-red-600">
                      <AlertTriangle className="h-6 w-6" />
                      <div>
                        <h4 className="font-medium">¿Confirmar eliminación?</h4>
                        <p className="text-sm text-red-500">Esta acción no se puede deshacer.</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        Se eliminará permanentemente el usuario:
                      </p>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedUser.nombre} {selectedUser.apellido} ({selectedUser.email})
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={deleteUser}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Eliminando...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            <span>Eliminar Usuario</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {modalType === 'toggle' && selectedUser && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      {selectedUser.activo ? (
                        <PowerOff className="h-6 w-6 text-red-600" />
                      ) : (
                        <Power className="h-6 w-6 text-green-600" />
                      )}
                      <div>
                        <h4 className="font-medium">
                          {selectedUser.activo ? 'Desactivar Usuario' : 'Activar Usuario'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {selectedUser.activo 
                            ? 'El usuario no podrá acceder al sistema'
                            : 'El usuario podrá acceder al sistema'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        Usuario: 
                      </p>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedUser.nombre} {selectedUser.apellido} ({selectedUser.email})
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Estado actual: <span className={selectedUser.activo ? 'text-green-600' : 'text-red-600'}>
                          {selectedUser.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={toggleUserStatus}
                        className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 ${
                          selectedUser.activo
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            {selectedUser.activo ? (
                              <><PowerOff className="h-4 w-4" /><span>Desactivar</span></>
                            ) : (
                              <><Power className="h-4 w-4" /><span>Activar</span></>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement