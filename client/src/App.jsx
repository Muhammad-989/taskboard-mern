import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, CirclePlus, GripVertical, LogOut, MoreHorizontal, Search, Sparkles, X } from 'lucide-react';
import { api } from './api';
import { useAuth } from './AuthContext';
import './App.css';

function AuthScreen() {
  const { signIn, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await (mode === 'login' ? signIn(form) : register(form)); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><div className="brand auth-brand"><div className="brand-mark"><Check size={17} strokeWidth={3} /></div><span>taskboard</span></div><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</span><h1>{mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}</h1><p className="auth-subtitle">{mode === 'login' ? 'Pick up where your team left off.' : 'A focused home for your team’s work.'}</p><form onSubmit={submit}>{mode === 'register' && <label>Your name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Morgan" /></label>}<label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label><label>Password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></label>{error && <p className="form-error">{error}</p>}<button className="primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button></form><button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button></div></main>;
}

function Card({ card, onDelete, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card._id });
  const [menuOpen, setMenuOpen] = useState(false);
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`task-card ${isDragging ? 'dragging' : ''}`}><div className="card-topline"><span className={`priority ${card.priority}`}>{card.priority}</span><div className="action-menu"><button className="icon-button" onClick={() => setMenuOpen((open) => !open)} aria-label={`Actions for ${card.title}`} aria-expanded={menuOpen}><MoreHorizontal size={16} /></button>{menuOpen && <div className="menu-popover"><button onClick={() => { setMenuOpen(false); onEdit(card); }}>Edit title</button><button className="danger-menu-item" onClick={() => { setMenuOpen(false); onDelete(card); }}>Delete task</button></div>}</div></div><h3>{card.title}</h3><div className="card-footer"><div className="labels">{(card.labels ?? []).map((label) => <span className="label" key={label}>{label}</span>)}</div><div className="avatar">ME</div></div><button className="drag-handle" {...attributes} {...listeners} aria-label={`Drag ${card.title}`}><GripVertical size={14} /></button></article>;
}

function Column({ column, cards, onAdd, onDelete, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${column._id}` });
  const [menuOpen, setMenuOpen] = useState(false);
  return <section ref={setNodeRef} className={`column ${isOver ? 'drop-target' : ''}`}><header className="column-header"><div className="column-title"><span className="status-dot" /><h2>{column.title}</h2><span className="count">{cards.length}</span></div><div className="action-menu"><button className="icon-button" onClick={() => setMenuOpen((open) => !open)} aria-label={`Actions for ${column.title}`} aria-expanded={menuOpen}><MoreHorizontal size={18} /></button>{menuOpen && <div className="menu-popover column-menu"><button onClick={() => { setMenuOpen(false); onAdd(column._id); }}>Add task here</button></div>}</div></header><SortableContext items={cards.map((card) => card._id)} strategy={verticalListSortingStrategy}><div className="card-list">{cards.map((card) => <Card card={card} key={card._id} onDelete={onDelete} onEdit={onEdit} />)}</div></SortableContext><button className="add-card" onClick={() => onAdd(column._id)}><CirclePlus size={17} /> Add task</button></section>;
}

function TaskModal({ columns, defaultColumn, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', columnId: defaultColumn, label: '' });
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="task-modal" onSubmit={(e) => { e.preventDefault(); if (form.title.trim()) onCreate({ ...form, title: form.title.trim(), labels: form.label.trim() ? [form.label.trim()] : [] }); }}><div className="modal-header"><div><span className="eyebrow">NEW TASK</span><h2>Create a task</h2></div><button type="button" className="close-button" onClick={onClose}><X size={19} /></button></div><label>Task title<input autoFocus required name="title" value={form.title} onChange={update} placeholder="What needs to be done?" /></label><label>Description <span className="optional">Optional</span><textarea name="description" value={form.description} onChange={update} rows="3" placeholder="Add a little context..." /></label><div className="form-grid"><label>Priority<select name="priority" value={form.priority} onChange={update}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Column<select name="columnId" value={form.columnId} onChange={update}>{columns.map((column) => <option value={column._id} key={column._id}>{column.title}</option>)}</select></label></div><label>Label <span className="optional">Optional</span><input name="label" value={form.label} onChange={update} placeholder="e.g. Design" /></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="primary" type="submit"><CirclePlus size={17} /> Create task</button></div></form></div>;
}

function EditTaskModal({ card, onClose, onSave }) {
  const [form, setForm] = useState({
    title: card.title,
    description: card.description ?? '',
    priority: card.priority,
    label: card.labels?.[0] ?? '',
  });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="task-modal" onSubmit={(event) => { event.preventDefault(); if (form.title.trim()) onSave({ title: form.title.trim(), description: form.description, priority: form.priority, labels: form.label.trim() ? [form.label.trim()] : [] }); }}><div className="modal-header"><div><span className="eyebrow">EDIT TASK</span><h2>Update task</h2></div><button type="button" className="close-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><label>Task title<input autoFocus required name="title" value={form.title} onChange={update} /></label><label>Description <span className="optional">Optional</span><textarea name="description" value={form.description} onChange={update} rows="3" placeholder="Add a little context..." /></label><label>Priority<select name="priority" value={form.priority} onChange={update}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Label <span className="optional">Optional</span><input name="label" value={form.label} onChange={update} placeholder="e.g. Design" /></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="primary" type="submit">Save changes</button></div></form></div>;
}

function BoardModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setError('');
    setBusy(true);
    try {
      await onCreate({ title: form.title.trim(), description: form.description.trim() });
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="task-modal" onSubmit={submit}><div className="modal-header"><div><span className="eyebrow">NEW BOARD</span><h2>Create a board</h2></div><button type="button" className="close-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><label>Board name<input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Website redesign" /></label><label>Description <span className="optional">Optional</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="3" placeholder="What is this board for?" /></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create board'}</button></div></form></div>;
}

function BoardApp() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalColumn, setModalColumn] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const boardsQuery = useQuery({ queryKey: ['boards'], queryFn: api.boards });
  const boardId = selectedBoard ?? boardsQuery.data?.[0]?._id;
  const boardQuery = useQuery({ queryKey: ['board', boardId], queryFn: () => api.board(boardId), enabled: Boolean(boardId) });
  const createBoard = useMutation({ mutationFn: api.createBoard, onSuccess: (board) => { queryClient.invalidateQueries({ queryKey: ['boards'] }); setSelectedBoard(board._id); } });
  const createCard = useMutation({ mutationFn: ({ board, body }) => api.createCard(board, body), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }) });
  const updateCard = useMutation({ mutationFn: ({ id, body }) => api.updateCard(id, body), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }) });
  const deleteCard = useMutation({ mutationFn: api.deleteCard, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }) });
  const moveCard = useMutation({ mutationFn: ({ id, body }) => api.moveCard(id, body), onError: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }) });
  const board = boardQuery.data?.board;
  const cards = boardQuery.data?.cards ?? [];
  const visible = useMemo(() => cards.filter((card) => card.title.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || card.priority === filter)), [cards, search, filter]);
  function handleDrop({ active, over }) {
    if (!over || !board) return;
    const moving = cards.find((card) => card._id === active.id);
    const overCard = cards.find((card) => card._id === over.id);
    const columnId = overCard?.columnId ?? over.id.replace('column:', '');
    if (!moving || !columnId || String(moving.columnId) === columnId && !overCard) return;
    const target = cards.filter((card) => String(card.columnId) === columnId && card._id !== moving._id);
    const index = overCard ? Math.max(0, target.findIndex((card) => card._id === overCard._id)) : target.length;
    const before = target[index - 1]?.position; const after = target[index]?.position;
    const position = before !== undefined && after !== undefined ? (before + after) / 2 : before !== undefined ? before + 1000 : after !== undefined ? after / 2 : 1000;
    const previous = queryClient.getQueryData(['board', boardId]);
    queryClient.setQueryData(['board', boardId], (data) => data && { ...data, cards: data.cards.map((card) => card._id === moving._id ? { ...card, columnId, position } : card).sort((a, b) => String(a.columnId).localeCompare(String(b.columnId)) || a.position - b.position) });
    moveCard.mutate({ id: moving._id, body: { columnId, position } }, { onError: () => queryClient.setQueryData(['board', boardId], previous) });
  }
  if (boardsQuery.isLoading) return <div className="loading-screen">Loading your workspace…</div>;
  if (boardsQuery.isError) return <div className="loading-screen">Could not load boards: {boardsQuery.error.message}</div>;
  function editCard(card) { setEditingCard(card); }
  function confirmDelete(card) { if (window.confirm(`Delete "${card.title}"? This cannot be undone.`)) deleteCard.mutate(card._id); }
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Check size={17} strokeWidth={3} /></div><span>taskboard</span></div><div className="workspace-switcher"><div className="workspace-icon">{user.name[0]}</div><div><strong>{user.name}</strong><small>{user.email}</small></div></div><nav><p className="nav-label">Workspace</p><button className="nav-item active"><span className="nav-symbol">▦</span>My boards <span className="nav-count">{boardsQuery.data.length}</span></button><p className="nav-label projects-label">Boards <button className="mini-button" onClick={() => setBoardModalOpen(true)} aria-label="Create board">+</button></p>{boardsQuery.data.map((item) => <button className={`nav-item project ${item._id === boardId ? 'active-project' : ''}`} key={item._id} onClick={() => setSelectedBoard(item._id)}><i className="project-dot blue" />{item.title}</button>)}</nav><div className="sidebar-bottom"><div className="help-card"><Sparkles size={17} /><div><strong>Connected workspace</strong></div></div><button className="user-row logout-button" onClick={signOut}><div className="avatar large">{user.name.slice(0, 2).toUpperCase()}</div><div><strong>Sign out</strong><small>{user.name}</small></div><LogOut size={16} /></button></div></aside><main className="main"><header className="topbar"><div className="breadcrumbs"><span>My boards</span><b>/</b><strong>{board?.title ?? 'No board selected'}</strong></div><div className="top-actions"><div className="search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." /></div><div className="avatar large">{user.name.slice(0, 2).toUpperCase()}</div></div></header><div className="content">{!board && <div className="empty-view"><div className="empty-icon"><Sparkles size={22} /></div><h2>Create your first board</h2><p>Boards keep projects focused and make progress visible.</p><button className="primary" onClick={() => createBoard.mutate({ title: 'My first board', description: 'A place to organize your work.' })}><CirclePlus size={17} /> Create board</button></div>}{board && <><div className="board-heading"><div><div className="eyebrow">PROJECT BOARD <span className="live-dot" /> Saved</div><h1>{board.title}</h1><p>{board.description || 'Keep the team aligned and move work forward.'}</p></div><div className="heading-actions"><select className="filter-button" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select><button className="primary" onClick={() => setModalColumn(board.columns[0]?._id)}><CirclePlus size={17} /> New task</button></div></div><div className="board-meta"><span className="updated"><span className="live-dot" /> Synced</span></div><DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDrop}><div className="board">{board.columns.map((column) => <Column key={column._id} column={column} cards={visible.filter((card) => String(card.columnId) === String(column._id))} onAdd={setModalColumn} onDelete={confirmDelete} onEdit={editCard} />)}</div></DndContext></>}</div></main>{boardModalOpen && <BoardModal onClose={() => setBoardModalOpen(false)} onCreate={(body) => createBoard.mutateAsync(body).then(() => setBoardModalOpen(false))} />}{modalColumn && board && <TaskModal columns={board.columns} defaultColumn={modalColumn} onClose={() => setModalColumn(null)} onCreate={(body) => { createCard.mutate({ board: board._id, body }, { onSuccess: () => setModalColumn(null) }); }} />}{editingCard && <EditTaskModal card={editingCard} onClose={() => setEditingCard(null)} onSave={(body) => { updateCard.mutate({ id: editingCard._id, body }, { onSuccess: () => setEditingCard(null) }); }} />}</div>;
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="loading-screen">Loading Taskboard…</div>;
  return user ? <BoardApp /> : <AuthScreen />;
}
