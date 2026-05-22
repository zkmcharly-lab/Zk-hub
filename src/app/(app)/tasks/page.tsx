'use client'
import { useState, useRef, useCallback, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { X, Check, UserRound, Plus, GripVertical, FileText, LayoutGrid, List } from "lucide-react"
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { TaskFormModal } from '@/components/tasks/task-form-modal'

// ── Lane config ───────────────────────────────────────────────────────────────
const LANES = [
  { key: "inmi",  label: "Inmi",  color: "#ec4899", rgb: "236,72,153",  bg: "rgba(236,72,153,0.07)",  border: "rgba(236,72,153,0.30)", dot: "#f472b6" },
  { key: "gabi",  label: "Gabi",  color: "#d97706", rgb: "217,119,6",   bg: "rgba(217,119,6,0.07)",   border: "rgba(217,119,6,0.30)",  dot: "#fbbf24" },
  { key: "fabri", label: "Fabri", color: "#16a34a", rgb: "22,163,74",   bg: "rgba(22,163,74,0.07)",   border: "rgba(22,163,74,0.30)",  dot: "#4ade80" },
] as const

type LaneKey = "inmi" | "gabi" | "fabri"
type FilterKey = "today" | "week" | "month" | "all"

const TIME_FILTERS: { key: FilterKey; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "week",  label: "Esta semana" },
  { key: "month", label: "Este mes" },
  { key: "all",   label: "Todas" },
]

function laneFor(key: string | null) { 
  return LANES.find((l) => l.key === key) || LANES[0]
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate + "T00:00:00") < today
}

interface Contact {
  id: string
  nombre: string
  empresa?: string | null
}

// ── ContactPicker ─────────────────────────────────────────────────────────────
function ContactPicker({ value, contacts, onChange }: {
  value: Contact | null;
  contacts: Contact[];
  onChange: (c: Contact | null) => void;
}) {
  const [open, setOpen] = useState(false)
  const has = !!value
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "0 10px", height: 32, borderRadius: 7, border: "1px solid",
            borderColor: has ? "rgba(59,130,246,0.3)" : "var(--zk-border)",
            backgroundColor: has ? "rgba(59,130,246,0.08)" : "var(--zk-bg-hover)",
            color: has ? "#60a5fa" : "var(--zk-text-muted)",
            fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          <UserRound size={12} />
          <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }}>
            {value ? value.nombre : "Contacto"}
          </span>
          {has && (
            <X size={11} onClick={(e) => { e.stopPropagation(); onChange(null) }}
              style={{ cursor: "pointer", opacity: 0.6 }} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent style={{ padding: 0, backgroundColor: "var(--zk-bg-elevated)", border: "1px solid var(--zk-border)", borderRadius: 10, width: 240 }} align="start">
        <Command style={{ backgroundColor: "transparent" }}>
          <CommandInput placeholder="Buscar contacto..." style={{ backgroundColor: "transparent", color: "var(--zk-text-primary)", fontSize: 13 }} />
          <CommandList style={{ maxHeight: 200 }}>
            <CommandEmpty style={{ color: "var(--zk-text-muted)", fontSize: 13, padding: "10px 12px" }}>Sin resultados</CommandEmpty>
            <CommandGroup>
              <CommandItem value="sin-contacto" onSelect={() => { onChange(null); setOpen(false) }} style={{ fontSize: 13, color: "var(--zk-text-secondary)" }}>
                <Check size={12} style={{ opacity: !value ? 1 : 0, marginRight: 6, flexShrink: 0 }} /> Sin contacto
              </CommandItem>
              {contacts.map((c) => (
                <CommandItem key={c.id} value={`${c.nombre} ${c.empresa ?? ""}`} onSelect={() => { onChange(c); setOpen(false) }} style={{ fontSize: 13, color: "var(--zk-text-primary)" }}>
                  <Check size={12} style={{ opacity: value?.id === c.id ? 1 : 0, marginRight: 6, flexShrink: 0 }} />
                  {c.nombre}{c.empresa && <span style={{ color: "var(--zk-text-muted)" }}> · {c.empresa}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ── StickyNote Modal ──────────────────────────────────────────────────────────
function StickyNoteModal({ task, lane, onClose, onSave, onToggle, onDelete }: {
  task: any
  lane: typeof LANES[number]
  onClose: () => void
  onSave: (id: string, text: string, notes: string) => void
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(task.text)
  const [notes, setNotes] = useState(task.notes ?? "")
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const handleSave = () => {
    if (title.trim()) onSave(task.id, title.trim(), notes)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave()
    if (e.key === "Escape") onClose()
  }

  return (
    <>
      <div onClick={handleSave} style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.18)", backdropFilter: "blur(2px)" }} />
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1001,
        width: 420, maxWidth: "calc(100vw - 32px)", borderRadius: 16, overflow: "hidden",
        boxShadow: `0 24px 64px rgba(${lane.rgb},0.22), 0 8px 24px rgba(0,0,0,0.14)`,
        border: `1.5px solid rgba(${lane.rgb},0.3)`, backgroundColor: "var(--zk-bg-card)",
      }}>
        <div style={{ height: 8, background: lane.color }} />
        <div style={{ background: `rgba(${lane.rgb},0.07)`, padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: lane.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: lane.color, textTransform: "uppercase", letterSpacing: "0.08em", flex: 1 }}>{lane.label}</span>
            <button onClick={handleSave} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--zk-text-muted)", padding: 4, borderRadius: 6, lineHeight: 0 }}>
              <X size={16} />
            </button>
          </div>
          <textarea
            ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={handleKeyDown}
            rows={2} placeholder="Título de la tarea..."
            style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 17, fontWeight: 600, lineHeight: 1.4, color: "var(--zk-text-primary)", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ height: 1, background: `rgba(${lane.rgb},0.2)`, margin: "12px 0 14px" }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <FileText size={14} style={{ color: lane.color, flexShrink: 0, marginTop: 3 }} />
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} onKeyDown={handleKeyDown}
              rows={4} placeholder="Añadir desglose, notas adicionales..."
              style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 14, lineHeight: 1.6, color: "var(--zk-text-secondary)", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        </div>
        <div style={{ background: `rgba(${lane.rgb},0.06)`, borderTop: `1px solid rgba(${lane.rgb},0.15)`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => { onToggle(task.id, !task.done); onClose() }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid", borderColor: task.done ? "rgba(16,185,129,0.3)" : `rgba(${lane.rgb},0.3)`, background: task.done ? "rgba(16,185,129,0.08)" : "transparent", color: task.done ? "#10b981" : lane.color, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: 'inherit' }}>
            <Check size={12} strokeWidth={2.5} /> {task.done ? "Completada" : "Completar"}
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => { onDelete(task.id); onClose() }} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#ef4444", fontSize: 12, cursor: "pointer", fontFamily: 'inherit' }}>
            Eliminar
          </button>
          <button onClick={handleSave} disabled={!title.trim()} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: lane.color, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: title.trim() ? 1 : 0.5, fontFamily: 'inherit' }}>
            Guardar
          </button>
        </div>
      </div>
    </>
  )
}

// ── DraggableTaskCard ──────────────────────────────────────────────────────────
function DraggableTaskCard({ task, onToggle, onDelete, onExpand, laneColor, laneDot, overlay = false }: {
  task: any, onToggle: (id: string, done: boolean) => void, onDelete: (id: string) => void, onExpand: (task: any) => void, laneColor: string, laneDot: string, overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } })
  const [hover, setHover] = useState(false)
  const overdue = !task.done && isOverdue(task.due_date)
  const hasNotes = !!task.notes?.trim()

  return (
    <div ref={setNodeRef} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: "flex", alignItems: "flex-start", gap: 0,
      background: overlay ? "var(--zk-bg-elevated)" : "var(--zk-bg-card)",
      border: `1px solid var(--zk-border-subtle)`, borderLeft: `3px solid ${laneColor}`,
      borderRadius: 9, opacity: isDragging ? 0.3 : task.done ? 0.55 : 1,
      boxShadow: overlay ? "0 8px 24px rgba(0,0,0,0.15)" : hover ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
      transition: "box-shadow 0.15s", userSelect: "none", cursor: "default",
    }}>
      <div {...(overlay ? {} : { ...listeners, ...attributes })} style={{ flexShrink: 0, width: 20, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 11, cursor: overlay ? "grabbing" : "grab", color: hover ? "var(--zk-text-muted)" : "transparent", transition: "color 0.12s" }}>
        <GripVertical size={12} />
      </div>
      <div onClick={() => !overlay && onExpand(task)} style={{ flex: 1, minWidth: 0, padding: "10px 10px 10px 4px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <button onClick={(e) => { e.stopPropagation(); onToggle(task.id, !task.done) }} style={{ flexShrink: 0, width: 18, height: 18, borderRadius: "50%", marginTop: 1, border: task.done ? "none" : `2px solid ${laneColor}`, backgroundColor: task.done ? "#10b981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}>
            {task.done && <Check size={10} color="#fff" strokeWidth={3} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.4, color: task.done ? "var(--zk-text-muted)" : "var(--zk-text-primary)", textDecoration: task.done ? "line-through" : "none", wordBreak: "break-word" }}>{task.text}</p>
            {(task.contact || overdue || hasNotes) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5, alignItems: "center" }}>
                {overdue && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>vencida</span>}
                {task.contact && <span style={{ fontSize: 10.5, fontWeight: 500, padding: "1px 7px", borderRadius: 999, background: "rgba(59,130,246,0.08)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)", whiteSpace: "nowrap", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{task.contact.nombre}</span>}
                {hasNotes && <span title="Tiene notas"><FileText size={11} style={{ color: laneDot, opacity: 0.7 }} /></span>}
              </div>
            )}
          </div>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(task.id) }} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--zk-text-disabled)", padding: "10px 10px 10px 4px", marginTop: 1, opacity: hover ? 1 : 0, transition: "opacity 0.12s" }}>
        <X size={13} />
      </button>
    </div>
  )
}

// ── LaneColumn ────────────────────────────────────────────────────────────────
function LaneColumn({ lane, tasks, contacts, onToggle, onDelete, onExpand, onAddTask }: {
  lane: typeof LANES[number], tasks: any[], contacts: Contact[], onToggle: (id: string, done: boolean) => void, onDelete: (id: string) => void, onExpand: (task: any) => void, onAddTask: (laneKey: string, text: string, contactId?: string) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: lane.key })
  const [inputText, setInputText] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const pending = tasks.filter((t) => !t.done)
  const completed = tasks.filter((t) => t.done)

  const handleAdd = () => {
    if (!inputText.trim()) return
    onAddTask(lane.key, inputText.trim(), selectedContact?.id)
    setInputText(""); setSelectedContact(null); setAddOpen(false)
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: isOver ? lane.bg : "var(--zk-bg-card)", border: `1px solid ${isOver ? lane.border : "var(--zk-border)"}`, borderRadius: 14, overflow: "hidden", transition: "background 0.15s, border-color 0.15s" }}>
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid var(--zk-border-subtle)`, background: lane.bg, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: lane.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--zk-text-primary)", flex: 1 }}>{lane.label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: `${lane.color}22`, color: lane.color, border: `1px solid ${lane.border}` }}>{pending.length}</span>
      </div>
      <div ref={setNodeRef} style={{ flex: 1, overflowY: "auto", padding: "10px 10px 6px", display: "flex", flexDirection: "column", gap: 6, minHeight: 80 }}>
        {pending.map((task) => <DraggableTaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onExpand={onExpand} laneColor={lane.color} laneDot={lane.dot} />)}
        {completed.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--zk-text-disabled)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 4px 2px", marginTop: 4 }}>Completadas · {completed.length}</div>
            {completed.map((task) => <DraggableTaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onExpand={onExpand} laneColor={lane.color} laneDot={lane.dot} />)}
          </>
        )}
      </div>
      <div style={{ padding: "8px 10px 10px", borderTop: "1px solid var(--zk-border-subtle)", flexShrink: 0 }}>
        {addOpen ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input ref={inputRef} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAddOpen(false) }} placeholder="Nueva tarea..." style={{ width: "100%", height: 34, borderRadius: 7, fontSize: 13, background: "var(--zk-bg-input)", border: `1px solid ${lane.border}`, color: "var(--zk-text-primary)", padding: "0 10px", outline: "none", boxSizing: "border-box", fontFamily: 'inherit' }} />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ flex: 1 }}><ContactPicker value={selectedContact} contacts={contacts} onChange={setSelectedContact} /></div>
              <button onClick={handleAdd} disabled={!inputText.trim()} style={{ height: 32, padding: "0 14px", borderRadius: 7, border: "none", background: lane.color, color: "#fff", fontSize: 12, fontWeight: 600, cursor: inputText.trim() ? "pointer" : "not-allowed", opacity: inputText.trim() ? 1 : 0.5, fontFamily: 'inherit' }}>Agregar</button>
              <button onClick={() => setAddOpen(false)} style={{ height: 32, width: 32, borderRadius: 7, border: "1px solid var(--zk-border)", background: "none", cursor: "pointer", color: "var(--zk-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setAddOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }} style={{ width: "100%", height: 32, borderRadius: 7, border: `1px dashed ${lane.border}`, background: "transparent", cursor: "pointer", color: lane.color, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background 0.15s", fontFamily: 'inherit' }} onMouseEnter={(e) => { e.currentTarget.style.background = lane.bg }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
            <Plus size={13} /> Agregar tarea
          </button>
        )}
      </div>
    </div>
  )
}

// ── TeamView ─────────────────────────────────────────────────────────────────
function TeamView({ tasks, onToggle, onDelete, onExpand }: { tasks: any[], onToggle: (id: string, done: boolean) => void, onDelete: (id: string) => void, onExpand: (task: any) => void }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
      {LANES.map((lane) => {
        const laneTasks = tasks.filter((t) => t.assignee_slot === lane.key)
        const pending = laneTasks.filter((t) => !t.done)
        const done = laneTasks.filter((t) => t.done)
        return (
          <div key={lane.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: lane.dot }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: lane.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{lane.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: `${lane.color}18`, color: lane.color, border: `1px solid ${lane.border}` }}>{pending.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {laneTasks.length === 0 && <p style={{ fontSize: 12, color: "var(--zk-text-disabled)", padding: "8px 0" }}>Sin tareas</p>}
              {[...pending, ...done].map((task) => {
                const overdue = !task.done && isOverdue(task.due_date)
                const hasNotes = !!task.notes?.trim()
                return (
                  <div key={task.id} onClick={() => onExpand(task)} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--zk-bg-card)", border: `1px solid var(--zk-border-subtle)`, borderLeft: `3px solid ${lane.color}`, borderRadius: 9, padding: "10px 14px", opacity: task.done ? 0.55 : 1, cursor: "pointer", transition: "box-shadow 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)" }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none" }}>
                    <button onClick={(e) => { e.stopPropagation(); onToggle(task.id, !task.done) }} style={{ flexShrink: 0, width: 18, height: 18, borderRadius: "50%", marginTop: 1, border: task.done ? "none" : `2px solid ${lane.color}`, backgroundColor: task.done ? "#10b981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}>
                      {task.done && <Check size={10} color="#fff" strokeWidth={3} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, lineHeight: 1.4, color: task.done ? "var(--zk-text-muted)" : "var(--zk-text-primary)", textDecoration: task.done ? "line-through" : "none", wordBreak: "break-word" }}>{task.text}</p>
                      {(task.contact || overdue || hasNotes || task.due_date) && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5, alignItems: "center" }}>
                          {overdue && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>vencida</span>}
                          {task.due_date && !overdue && <span style={{ fontSize: 10, color: "var(--zk-text-muted)" }}>{new Date(task.due_date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>}
                          {task.contact && <span style={{ fontSize: 10.5, fontWeight: 500, padding: "1px 7px", borderRadius: 999, background: "rgba(59,130,246,0.08)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>{task.contact.nombre}</span>}
                          {hasNotes && <FileText size={11} style={{ color: lane.dot, opacity: 0.7 }} />}
                        </div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(task.id) }} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--zk-text-disabled)", padding: 4, opacity: 0, transition: "opacity 0.12s" }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "1" }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "0" }}>
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── TasksPage ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [filter, setFilter] = useState<FilterKey>("all")
  const [viewMode, setViewMode] = useState<"kanban" | "team">("kanban")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: tasks = [] } = useTasks(filter)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [contacts, setContacts] = useState<Contact[]>([])
  const { workspace } = useWorkspaceStore()
  useEffect(() => {
    if (workspace?.id) {
      createClient().from('contacts').select('id, nombre, empresa').eq('workspace_id', workspace.id).limit(200)
        .then(({ data }) => setContacts(data ?? []))
    }
  }, [workspace?.id])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const overId = over.id as string
    const isLane = LANES.some((l) => l.key === overId)
    if (!isLane) return
    const task = tasks.find((t) => t.id === active.id)
    if (!task || task.assignee_slot === overId) return
    updateTask.mutate({ id: task.id, data: { assignee_slot: overId } })
  }

  const handleToggle = (id: string, done: boolean) => updateTask.mutate({ id, data: { done } })
  const handleDelete = (id: string) => deleteTask.mutate(id)
  const handleSaveNote = (id: string, text: string, notes: string) => updateTask.mutate({ id, data: { text, notes } })
  const handleAddTask = (laneKey: string, text: string, contactId?: string) => createTask.mutate({ text, assignee_slot: laneKey, contact_id: contactId || null, due_date: null, notes: null })

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null
  const expandedLane = expandedTask?.assignee_slot ? laneFor(expandedTask.assignee_slot) : null

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 28px", flexShrink: 0, borderBottom: "1px solid var(--zk-border-subtle)", backgroundColor: "var(--zk-topbar-bg)", display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--zk-text-primary)", margin: 0, marginRight: 8 }}>Tareas</h1>
        
        {/* Time filters */}
        <div style={{ display: "flex", gap: 4 }}>
          {TIME_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key as any)} style={{
              padding: '5px 12px', fontSize: 12.5, fontWeight: 500, borderRadius: 99, border: '0.8px solid',
              borderColor: filter === key ? 'rgba(232,25,60,0.35)' : 'var(--zk-border)',
              backgroundColor: filter === key ? 'rgba(232,25,60,0.08)' : 'transparent',
              color: filter === key ? '#E8193C' : 'var(--zk-text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 0, border: '0.8px solid var(--zk-border)', borderRadius: 8, overflow: 'hidden' }}>
          {([{ key: 'kanban', label: 'Tablero', Icon: LayoutGrid }, { key: 'team', label: 'Lista', Icon: List }] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setViewMode(key)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: viewMode === key ? 'rgba(232,25,60,0.08)' : 'transparent', color: viewMode === key ? '#E8193C' : 'var(--zk-text-secondary)', fontFamily: 'inherit',
            }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', backgroundColor: '#E8193C', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }} onClick={() => setIsModalOpen(true)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C8102E'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E8193C'}>
          <Plus size={14} /> Nueva tarea
        </button>
      </div>

      {viewMode === "team" ? (
        <TeamView tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} onExpand={setExpandedTask} />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '20px 28px 24px', backgroundColor: 'var(--zk-bg-page)' }}>
            {LANES.map((lane) => (
              <LaneColumn key={lane.key} lane={lane} tasks={tasks.filter((t) => t.assignee_slot === lane.key)} contacts={contacts} onToggle={handleToggle} onDelete={handleDelete} onExpand={setExpandedTask} onAddTask={handleAddTask} />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeTask && <DraggableTaskCard task={activeTask} onToggle={() => {}} onDelete={() => {}} onExpand={() => {}} laneColor={laneFor(activeTask.assignee_slot).color} laneDot={laneFor(activeTask.assignee_slot).dot} overlay />}
          </DragOverlay>
        </DndContext>
      )}

      {expandedTask && expandedLane && (
        <StickyNoteModal task={expandedTask} lane={expandedLane} onClose={() => setExpandedTask(null)} onSave={handleSaveNote} onToggle={handleToggle} onDelete={handleDelete} />
      )}
      <TaskFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
