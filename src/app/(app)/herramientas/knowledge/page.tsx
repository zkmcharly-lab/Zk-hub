'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  BookOpen, Search, Copy, Check, Upload, Trash2, 
  FileText, FileCode, CheckCircle, Info, HelpCircle, 
  Sparkles, Code, Settings, Terminal
} from 'lucide-react'

interface DocumentItem {
  id: string
  title: string
  description: string
  category: 'prompts' | 'skills' | 'estructuras'
  content: string
  size: string
  lastModified: string
  isCustom?: boolean
}

// Predefined premium mock data for ZK Marketing
const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Prompt de Auditoría SEO/CRO profunda para eCommerce',
    description: 'Prompt maestro diseñado para analizar landing pages y estructurar diagnósticos de conversión.',
    category: 'prompts',
    size: '4.2 KB',
    lastModified: '2026-05-20',
    content: `# Prompt Maestro: Auditor de CRO y SEO Técnico para eCommerce

Actúa como un Consultor Senior de Optimización de Tasa de Conversión (CRO) y Especialista en SEO On-Page para tiendas online. Tu objetivo es realizar una auditoría implacable y constructiva del landing page de un cliente en base al texto plano provisto.

## Instrucciones de Análisis:
1. **Propuesta de Valor (Primer Impacto):** Evalúa si en los primeros 3 segundos queda claro qué vende la marca y cuál es su factor diferencial.
2. **Jerarquía Visual y Mensaje:** Analiza el orden de los títulos, copys y llamadas a la acción (CTA).
3. **Fricciones en el Checkout:** Busca puntos débiles en el flujo de compra indicados en el texto (ej. falta de sellos de confianza, envíos oscuros, etc.).
4. **Optimización SEO:** Inspecciona palabras clave, estructura H1-H3, metadatos sugeridos y densidad semántica.

## Formato de Salida Requerido:
- **Resumen Ejecutivo:** Puntuación global del 1 al 10.
- **Top 3 Errores Críticos:** Qué está matando las ventas de forma inmediata.
- **Lista de Acción Directa:** 5 cambios rápidos de implementar (Quick Wins) ordenados por impacto.
- **Propuesta de Metadatos:** Título SEO alternativo (max 60 chars) y Meta Descripción persuasiva (max 155 chars).`
  },
  {
    id: 'doc-2',
    title: 'Script de Prospección Directa para Instagram DM',
    description: 'Secuencia de primer contacto y prospección fría para marcas de moda eCommerce.',
    category: 'prompts',
    size: '2.8 KB',
    lastModified: '2026-05-24',
    content: `# Secuencia de Prospección Fría por DM de Instagram (eCommerce B2B)

Este prompt automatiza y refina la redacción de mensajes directos hiper-personalizados para marcas objetivo en Instagram.

## Esquema del Mensaje Core:
1. **Hook Específico (No genérico):** Referencia real a un post reciente, reel o colección del prospecto.
2. **Detección del Problema (Dolor):** Menciona sutilmente una oportunidad de mejora (ej. theme de Shopify lento, falta de píxel de meta, oportunidad en catálogo).
3. **Prueba Social Rápida:** Mencionar un caso de éxito con métricas del sector (ej. +45% de conversiones recurrentes).
4. **Llamada a la Acción (CTA) de Cero Fricción:** Pedir permiso para enviar un video rápido de 2 minutos analizando su tienda (Auditoría Express).

## Ejemplo de Script Generado:
"Hola [Nombre/Marca]! Estaba viendo su última colección de lino y el Reel de presentación quedó brutal 🙌. 

Analicé rápido su tienda desde el móvil y vi que el menú de categorías tiene un pequeño retraso al cargar, lo cual suele drenar hasta un 20% de las visitas interesadas en el checkout de Shopify. 

En ZK ayudamos a marcas como la tuya a acelerar la web sin cambiar el diseño, subiendo la conversión hasta un 35% promedio. 

¿Te vendría bien si te grabo un video rápido de 2 min mostrándote cómo solucionarlo? Cero compromisos, solo feedback real."`
  },
  {
    id: 'doc-3',
    title: 'Cualificación B2B de Clientes e-Commerce',
    description: 'Metodología formal para calificar leads mediante perfiles de Instagram y tráfico estimado.',
    category: 'skills',
    size: '3.1 KB',
    lastModified: '2026-05-18',
    content: `# Skill: Calificación de Leads e-Commerce en Instagram

Esta es la guía operativa del framework KaizenDw para calificar marcas a prospectar.

## Parámetros de Cualificación:
1. **Seguidores e Interacción:**
   - Mínimo: 15K seguidores.
   - Proporción de Likes/Comentarios activa (evitar cuentas con seguidores comprados).
2. **Dolores Técnicos Detectables:**
   - Sitio construido sobre Shopify utilizando plantillas gratuitas o anticuadas (Dawn, Debut, etc.).
   - Falta de carga perezosa en imágenes o pesos de banner elevados.
   - Píxel de Meta Ads activo pero sin campañas de retargeting estructuradas (verificable en Biblioteca de Anuncios).
3. **Ticket Medio Estimado:**
   - La marca debe comercializar productos físicos propios con un precio unitario promedio superior a 40€ para asegurar margen para nuestros servicios.

## Criterio de Descarte (Negativo):
- Marcas multi-marca que revenden productos genéricos de AliExpress.
- Cuentas con comentarios bloqueados o ausentes por completo en los últimos 20 posts.`
  },
  {
    id: 'doc-4',
    title: 'Manejo de Objeciones en Cierre de Ventas',
    description: 'SOP para cerrar ofertas de mantenimiento y desarrollo de embudos.',
    category: 'skills',
    size: '3.9 KB',
    lastModified: '2026-05-22',
    content: `# SOP: Manejo de Objeciones de Presupuesto y Mantenimiento

Protocolo para el equipo de ventas de ZK Hub ante reticencias de precio en la fase de propuesta final.

## Objeción 1: "Es un coste mensual muy elevado"
- **Respuesta Mental:** El cliente ve el servicio como un gasto de soporte técnico y no como una inversión en ingresos recurrentes.
- **Acción Persuasiva:** 
  1. Desglosa la propuesta en términos de valor diario (ej. "Son solo 25€ al día, menos de lo que gastas en captar un solo cliente calificado").
  2. Muestra la métrica de retorno: cuántas compras adicionales necesitan al mes para cubrir nuestra cuota de mantenimiento de 500€ (ej. "Con tu ticket medio de 80€, solo requerimos 6 ventas extra al mes para rentabilizar el sistema al 100%").

## Objeción 2: "Ya tenemos un desarrollador de confianza"
- **Acción Persuasiva:** 
  "Es fantástico que cuenten con soporte constante. Nosotros no venimos a sustituir a tu programador, sino a potenciar su trabajo. Él se encarga de la estética y el stock, mientras nosotros implementamos el motor de analítica, atribución de anuncios y conversión CRO profunda que maximiza su código."`
  },
  {
    id: 'doc-5',
    title: 'Esquema de Base de Datos para ZK CRM',
    description: 'Modelado ERD de tablas, llaves primarias y relaciones entre clientes, cobros y proyectos.',
    category: 'estructuras',
    size: '5.5 KB',
    lastModified: '2026-05-25',
    content: `# Arquitectura de Datos: Esquema ZK Hub v2

Esquema técnico de bases de datos relacionales en Supabase PostgreSQL.

\`\`\`sql
-- Tabla Principal: contactos (representa clientes/leads)
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    empresa VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(50),
    temperatura VARCHAR(20) DEFAULT 'frio', -- frio, tibio, caliente
    sitio_web TEXT,
    nicho VARCHAR(100),
    maps_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla Relacionada: proyectos
CREATE TABLE public.proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- KDW (KaizenDw) o VC (VibeCoding)
    fase_actual INTEGER DEFAULT 1,
    porcentaje INTEGER DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'activo', -- activo, pausado, entregado
    logo_url TEXT,
    banner_url TEXT,
    fecha_entrega DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Relación N-1: proyecto_fases y proyecto_tareas
-- Las fases se crean automáticamente del 1 al 6 al insertar un proyecto.
-- Las tareas se estructuran internamente ordenadas por un campo 'orden'.
\`\`\``
  },
  {
    id: 'doc-6',
    title: 'Workflow n8n: Automatización de Leads y Notificaciones',
    description: 'Diseño lógico del flujo de trabajo en n8n desde GoHighLevel hasta Whatsapp.',
    category: 'estructuras',
    size: '6.1 KB',
    lastModified: '2026-05-26',
    content: `# Arquitectura del Flujo de Automatización en n8n

Este flujo capta eventos en tiempo real de leads calificados y despacha alertas automáticas al canal corporativo.

## Diagrama Lógico del Proceso:
\`\`\`
[Webhook GHL] ──> [Filtro Temperatura] ──> [OpenAI: Enriquecer Lead]
                                                  │
                                                  ▼
[Notificación WhatsApp] <── [Supabase Insert] <── [Mapear Objeto JSON]
\`\`\`

## Nodos y Configuraciones:
1. **Webhook Receiver (GHL):** Escucha el evento \`Lead Form Submitted\` y captura parámetros de nombre, email, teléfono, sitio web e Instagram.
2. **OpenAI Agent (GPT-4o-mini):** Toma el sitio web del eCommerce y ejecuta un scrap semántico para extraer el nicho exacto, puntos de dolor potenciales y redactar una propuesta inicial de una frase.
3. **Supabase Connector:** Inserta de forma síncrona el lead cualificado en la tabla \`temporal_leads\` para revisión interactiva del equipo.
4. **WhatsApp Business API:** Despacha un mensaje de alerta enriquecido a Charly e Inma para seguimiento inmediato si la temperatura del lead califica como "caliente".`
  }
]

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'prompts' | 'skills' | 'estructuras'>('all')
  const [selectedDocId, setSelectedDocId] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Load documents from localStorage or initial mock data
  useEffect(() => {
    const saved = localStorage.getItem('zk_knowledge_docs')
    if (saved) {
      try {
        setDocuments(JSON.parse(saved))
      } catch (e) {
        setDocuments(INITIAL_DOCUMENTS)
      }
    } else {
      setDocuments(INITIAL_DOCUMENTS)
      localStorage.setItem('zk_knowledge_docs', JSON.stringify(INITIAL_DOCUMENTS))
    }
  }, [])

  // Auto-select the first document in the current filtered list
  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  useEffect(() => {
    if (filteredDocs.length > 0) {
      // Keep selected doc if it's still in the filtered list, otherwise select the first
      const exists = filteredDocs.some(doc => doc.id === selectedDocId)
      if (!exists) {
        setSelectedDocId(filteredDocs[0].id)
      }
    } else {
      setSelectedDocId('')
    }
  }, [selectedDocId, filteredDocs])

  const selectedDoc = documents.find(doc => doc.id === selectedDocId)

  // Copy to Clipboard Action
  const handleCopy = () => {
    if (!selectedDoc) return
    navigator.clipboard.writeText(selectedDoc.content)
    setCopied(true)
    toast.success('¡Contenido copiado al portapapeles con éxito!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle local File Upload with Strict Client-Side validation (Max 2 MB, type JSON/TXT/MD)
  const handleFileUpload = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return
    const file = filesList[0]

    // 1. Strict size validation: 2MB max limit
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`Error de Peso: El archivo "${file.name}" mide ${(file.size / 1024 / 1024).toFixed(2)} MB. Supera el máximo permitido de 2 MB.`)
      return
    }

    // 2. Strict file type validation
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'md' && ext !== 'txt' && ext !== 'json') {
      toast.error(`Error de Formato: Tipo de archivo ".${ext}" no soportado. Permite únicamente formatos .md, .txt y .json`)
      return
    }

    // Read file contents
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) {
        toast.error('No se pudo leer el contenido del archivo.')
        return
      }

      // Auto-assign category based on file name or content keywords
      let guessedCategory: 'prompts' | 'skills' | 'estructuras' = 'estructuras'
      const lowercaseName = file.name.toLowerCase()
      const lowercaseContent = text.toLowerCase()
      
      if (lowercaseName.includes('prompt') || lowercaseContent.includes('prompt') || lowercaseContent.includes('actúa como')) {
        guessedCategory = 'prompts'
      } else if (lowercaseName.includes('skill') || lowercaseName.includes('sop') || lowercaseContent.includes('skill') || lowercaseContent.includes('pasos:')) {
        guessedCategory = 'skills'
      }

      // Create new document object
      const formattedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`
      const newDoc: DocumentItem = {
        id: `custom-${Date.now()}`,
        title: formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1),
        description: `Documento importado localmente desde el archivo ${file.name}.`,
        category: guessedCategory,
        content: text,
        size: sizeStr,
        lastModified: new Date().toISOString().split('T')[0],
        isCustom: true
      }

      const updatedDocs = [newDoc, ...documents]
      setDocuments(updatedDocs)
      localStorage.setItem('zk_knowledge_docs', JSON.stringify(updatedDocs))
      setSelectedDocId(newDoc.id)
      toast.success(`Archivo "${file.name}" cargado en la categoría: ${guessedCategory.toUpperCase()}`)
    }

    reader.readAsText(file)
  }

  // Handle document deletion
  const handleDeleteDoc = (id: string) => {
    if (!window.confirm('¿Deseas eliminar este documento de la base de conocimiento?')) return
    const updatedDocs = documents.filter(doc => doc.id !== id)
    setDocuments(updatedDocs)
    localStorage.setItem('zk_knowledge_docs', JSON.stringify(updatedDocs))
    toast.success('Documento eliminado correctamente.')
  }

  // Drag and Drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const onDragLeave = () => {
    setIsDragOver(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  return (
    <div className="flex h-full flex-row bg-[#F9FAFB] overflow-hidden">
      
      {/* ── SIDEBAR: CATEGORIES AND SEARCH ── */}
      <aside className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0 h-full">
        {/* Search */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="text-[#E8193C] w-5 h-5 shrink-0" />
            <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Base de Conocimiento</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar prompts, skills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[12.5px] border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#E8193C] focus:border-[#E8193C] outline-none transition-all placeholder-gray-400"
            />
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5 shrink-0">
          {[
            { id: 'all', label: 'Todo' },
            { id: 'prompts', label: 'Prompts' },
            { id: 'skills', label: 'Skills' },
            { id: 'estructuras', label: 'Estructuras' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-[12px] italic">
              Ningún documento coincide con los filtros.
            </div>
          ) : (
            filteredDocs.map(doc => {
              const isSelected = doc.id === selectedDocId
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-red-50/30 border-[#E8193C]/20 shadow-sm'
                      : 'border-transparent hover:bg-gray-50 hover:border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-[12.5px] font-bold truncate flex-1 ${
                      isSelected ? 'text-[#E8193C]' : 'text-gray-800'
                    }`}>
                      {doc.title}
                    </h4>
                    <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 scale-90 origin-right">
                      {doc.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-1">
                    {doc.description}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-gray-400 mt-2">
                    <span>Tamaño: {doc.size}</span>
                    <span>Mod: {doc.lastModified}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* File Dropzone in Sidebar */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`p-4 border-t border-gray-100 text-center transition-all cursor-pointer relative shrink-0 ${
            isDragOver ? 'bg-red-50/20' : 'bg-gray-50'
          }`}
        >
          <input
            type="file"
            accept=".md,.txt,.json"
            onChange={e => handleFileUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-1">
            <Upload className={`w-5 h-5 ${isDragOver ? 'text-[#E8193C]' : 'text-gray-400'}`} />
            <p className="text-[11.5px] font-semibold text-gray-700">Importar Archivo local</p>
            <p className="text-[9.5px] text-gray-400">Arrastra aquí un archivo .md, .txt o .json (max 2MB)</p>
          </div>
        </div>
      </aside>

      {/* ── CENTRAL AREA: MAIN DOCUMENT READER ── */}
      <main className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {selectedDoc ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Document Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#FCFDFE]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-[4px] text-[10px] uppercase font-extrabold tracking-wider border ${
                    selectedDoc.category === 'prompts' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                    selectedDoc.category === 'skills' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {selectedDoc.category}
                  </span>
                  <h1 className="text-[16px] md:text-[18px] font-bold text-gray-900 truncate">
                    {selectedDoc.title}
                  </h1>
                </div>
                <p className="text-[12px] text-gray-500 mt-1 truncate">
                  {selectedDoc.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-4">
                {selectedDoc.isCustom && (
                  <button
                    onClick={() => handleDeleteDoc(selectedDoc.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Eliminar documento local"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-[12px] font-bold transition-all shadow-sm"
                  title="Copiar contenido a portapapeles"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Document Reading View */}
            <div className="flex-1 overflow-y-auto p-8 prose max-w-none text-gray-700">
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Visual styling and decorations */}
                <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-4 flex items-start gap-3 shadow-inner">
                  <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div className="text-[11.5px] text-gray-500 leading-relaxed">
                    Este documento forma parte del sistema de operaciones de <strong>ZK Marketing</strong>. Utilízalo como guía estructurada para potenciar workflows de automatización en n8n o redactar prompts efectivos en OpenAI.
                  </div>
                </div>

                {/* Rendered Document Content */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-4">
                  {selectedDoc.content.split('\n').map((line, idx) => {
                    // Title H1
                    if (line.startsWith('# ')) {
                      return (
                        <h2 key={idx} className="text-[18px] md:text-[22px] font-bold text-gray-900 border-b border-gray-100 pb-2 mt-6 mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#E8193C]" />
                          {line.replace('# ', '')}
                        </h2>
                      )
                    }
                    // Title H2
                    if (line.startsWith('## ')) {
                      return (
                        <h3 key={idx} className="text-[15px] md:text-[16px] font-bold text-gray-800 mt-5 mb-2.5 flex items-center gap-1.5">
                          <Code className="w-4 h-4 text-gray-400" />
                          {line.replace('## ', '')}
                        </h3>
                      )
                    }
                    // Bullet list item
                    if (line.startsWith('- ')) {
                      return (
                        <ul key={idx} className="list-disc pl-6 space-y-1 my-1">
                          <li className="text-[13px] text-gray-600 leading-relaxed">
                            {line.replace('- ', '')}
                          </li>
                        </ul>
                      )
                    }
                    // Number list item
                    if (/^\d+\.\s/.test(line)) {
                      return (
                        <ol key={idx} className="list-decimal pl-6 space-y-1 my-1">
                          <li className="text-[13px] text-gray-600 leading-relaxed">
                            {line.replace(/^\d+\.\s/, '')}
                          </li>
                        </ol>
                      )
                    }
                    // Monospaced code blocks
                    if (line.startsWith('```')) {
                      return null // Skip backticks in simple renderer
                    }
                    // Bold texts highlight in lines
                    if (line.trim() === '') {
                      return <div key={idx} className="h-2" />
                    }

                    // Render standard line
                    return (
                      <p key={idx} className="text-[13.5px] leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {line}
                      </p>
                    )
                  })}
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-1"><Settings size={12} /> Peso del activo: {selectedDoc.size}</span>
                  <span className="flex items-center gap-1"><Terminal size={12} /> Última revisión: {selectedDoc.lastModified}</span>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
            <BookOpen size={48} className="text-gray-300 mb-4 stroke-1 animate-pulse" />
            <h3 className="text-[14px] font-bold text-gray-700">Base de Conocimiento Vacía</h3>
            <p className="text-[12px] text-gray-400 mt-1 max-w-sm">
              No hay documentos que coincidan con la búsqueda actual o no se han cargado documentos en esta categoría.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
