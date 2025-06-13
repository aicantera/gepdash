import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  ExternalLink,
  FileText,
  Calendar,
  Building,
  Users,
  Tag,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Save
} from 'lucide-react'

interface Document {
  id_senado_do: number
  created_at: string
  sinopsis: string
  iniciativa_text: string
  iniciativa_id: string
  gaceta: string
  link_iniciativa: string
  fuente: string
  imagen_link: string
  temas: string
  personas: string
  partidos: string
  leyes: string
  resumen: string
  analisis: string
  objeto: string
  correspondier: string
  tipo: string
}

interface Filters {
  fuente: string
  fechaDesde: string
  fechaHasta: string
  busqueda: string
}

const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    fuente: '',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)

  const documentsPerPage = 10
  const sources = [
    'Cámara de Diputados',
    'Cámara de Senadores', 
    'Diario Oficial de la Federación',
    'CONAMER'
  ]

  const fetchDocuments = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('senado')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.fuente) {
        query = query.eq('fuente', filters.fuente.toLowerCase())
      }

      if (filters.fechaDesde) {
        query = query.gte('created_at', filters.fechaDesde)
      }

      if (filters.fechaHasta) {
        query = query.lte('created_at', filters.fechaHasta + 'T23:59:59')
      }

      if (filters.busqueda) {
        const searchTerm = filters.busqueda.toLowerCase()
        query = query.or(`iniciativa_text.ilike.%${searchTerm}%,temas.ilike.%${searchTerm}%,personas.ilike.%${searchTerm}%,objeto.ilike.%${searchTerm}%`)
      }

      // Aplicar paginación
      const from = (currentPage - 1) * documentsPerPage
      const to = from + documentsPerPage - 1

      const { data, error: fetchError, count } = await query
        .range(from, to)

      if (fetchError) {
        throw fetchError
      }

      setDocuments(data || [])
      setTotalDocuments(count || 0)
      setTotalPages(Math.ceil((count || 0) / documentsPerPage))

    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('No se pudieron cargar los documentos. Intenta de nuevo más tarde.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [currentPage, filters])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      fuente: '',
      fechaDesde: '',
      fechaHasta: '',
      busqueda: ''
    })
    setCurrentPage(1)
  }

  const handleDownload = (document: Document) => {
    if (document.link_iniciativa) {
      window.open(document.link_iniciativa, '_blank')
    } else {
      alert('No hay enlace de descarga disponible para este documento.')
    }
  }

  const handleEdit = (document: Document) => {
    setSelectedDocument(document)
    setEditModalOpen(true)
  }

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    try {
      const { error } = await supabase
        .from('senado')
        .delete()
        .eq('id_senado_do', documentToDelete.id_senado_do)

      if (error) throw error

      setDeleteModalOpen(false)
      setDocumentToDelete(null)
      alert('El documento ha sido eliminado.')
      fetchDocuments()
    } catch (err) {
      console.error('Error deleting document:', err)
      alert('Error al eliminar el documento. Intenta nuevamente.')
    }
  }

  const handleSaveEdit = async (editedDocument: Document) => {
    try {
      const { error } = await supabase
        .from('senado')
        .update({
          iniciativa_text: editedDocument.iniciativa_text,
          tipo: editedDocument.tipo,
          personas: editedDocument.personas,
          objeto: editedDocument.objeto,
          correspondier: editedDocument.correspondier,
          temas: editedDocument.temas,
          gaceta: editedDocument.gaceta,
          link_iniciativa: editedDocument.link_iniciativa,
          sinopsis: editedDocument.sinopsis,
          resumen: editedDocument.resumen,
          analisis: editedDocument.analisis
        })
        .eq('id_senado_do', editedDocument.id_senado_do)

      if (error) throw error

      setEditModalOpen(false)
      setSelectedDocument(null)
      alert('Documento actualizado correctamente.')
      fetchDocuments()
    } catch (err) {
      console.error('Error updating document:', err)
      alert('Error al actualizar el documento. Intenta nuevamente.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateText = (text: string, maxLength: number = 60) => {
    if (!text) return 'Sin información'
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  const EditModal: React.FC = () => {
    const [editData, setEditData] = useState<Document>(selectedDocument!)

    const handleChange = (field: keyof Document, value: string) => {
      setEditData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      // Validar campos obligatorios
      if (!editData.iniciativa_text || !editData.tipo || !editData.objeto) {
        alert('Todos los campos obligatorios deben estar completos para guardar los cambios.')
        return
      }

      handleSaveEdit(editData)
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Editar Documento</h3>
            <button
              onClick={() => setEditModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="form-label">Título *</label>
                <input
                  type="text"
                  value={editData.iniciativa_text}
                  onChange={(e) => handleChange('iniciativa_text', e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Tipo de Proyecto *</label>
                <input
                  type="text"
                  value={editData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Proponente</label>
                <input
                  type="text"
                  value={editData.personas}
                  onChange={(e) => handleChange('personas', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Correspondiente</label>
                <input
                  type="text"
                  value={editData.correspondier}
                  onChange={(e) => handleChange('correspondier', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Temas/Subtemas</label>
                <input
                  type="text"
                  value={editData.temas}
                  onChange={(e) => handleChange('temas', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Gaceta</label>
                <input
                  type="text"
                  value={editData.gaceta}
                  onChange={(e) => handleChange('gaceta', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="form-label">Enlace PDF</label>
                <input
                  type="url"
                  value={editData.link_iniciativa}
                  onChange={(e) => handleChange('link_iniciativa', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="form-label">Objeto *</label>
                <textarea
                  value={editData.objeto}
                  onChange={(e) => handleChange('objeto', e.target.value)}
                  className="form-input h-24 resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Sinopsis</label>
                <textarea
                  value={editData.sinopsis}
                  onChange={(e) => handleChange('sinopsis', e.target.value)}
                  className="form-input h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Información Adicional (Senado)</label>
                <textarea
                  value={editData.analisis}
                  onChange={(e) => handleChange('analisis', e.target.value)}
                  className="form-input h-24 resize-none"
                  placeholder="Links al perfil del senador o senadores proponentes"
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Estatus (Senado)</label>
                <input
                  type="text"
                  value={editData.resumen}
                  onChange={(e) => handleChange('resumen', e.target.value)}
                  className="form-input"
                  placeholder="Estatus de la iniciativa o propuesta"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos Capturados</h1>
          <p className="text-gray-600">Gestión y análisis de documentos oficiales</p>
        </div>
        <button
          onClick={fetchDocuments}
          className="btn-primary flex items-center space-x-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <label className="form-label">Fuente</label>
            <select
              value={filters.fuente}
              onChange={(e) => handleFilterChange('fuente', e.target.value)}
              className="form-input"
            >
              <option value="">Todas las fuentes</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="form-label">Fecha desde</label>
            <input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <label className="form-label">Fecha hasta</label>
            <input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <label className="form-label">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar en título, temas, personas..."
                value={filters.busqueda}
                onChange={(e) => handleFilterChange('busqueda', e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Total: {totalDocuments} documentos</span>
          </div>
          
          {(filters.fuente || filters.fechaDesde || filters.fechaHasta || filters.busqueda) && (
            <button
              onClick={clearFilters}
              className="btn-outline text-sm flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-gray-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Cargando documentos, por favor espera...</span>
          </div>
        </div>
      )}

      {/* Documents Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {documents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">No se encontraron documentos</p>
              <p className="text-sm">No se encontraron documentos que coincidan con los criterios seleccionados.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fuente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Temas
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clientes
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((document) => (
                      <tr key={document.id_senado_do} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs">
                            {truncateText(document.iniciativa_text?.toUpperCase() || 'SIN TÍTULO', 80)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {document.tipo || 'Sin tipo'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Building className="w-3 h-3 mr-1" />
                            {document.fuente === 'senado' ? 'Cámara de Senadores' : document.fuente}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(document.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {truncateText(document.objeto || document.sinopsis || 'Sin descripción')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <Tag className="w-4 h-4 mr-2 text-gray-400" />
                            {truncateText(document.temas || 'Sin temas', 40)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Users className="w-3 h-3 mr-1" />
                            Sin clientes asociados
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleDownload(document)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(document)}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Editar documento"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(document)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar documento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {document.link_iniciativa && (
                              <button
                                onClick={() => window.open(document.link_iniciativa, '_blank')}
                                className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                                title="Ver enlace externo"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((currentPage - 1) * documentsPerPage) + 1} a {Math.min(currentPage * documentsPerPage, totalDocuments)} de {totalDocuments} documentos
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 text-sm rounded ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedDocument && <EditModal />}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && documentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
                <p className="text-gray-600">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas eliminar el documento "<strong>{truncateText(documentToDelete.iniciativa_text, 50)}</strong>"?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentManagement 