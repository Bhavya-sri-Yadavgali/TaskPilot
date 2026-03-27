import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Archive, Calendar as CalendarIcon, CheckCircle2, GripVertical } from "lucide-react";
import { format, parseISO } from "date-fns";
import API from "../services/api";

const COLUMNS = [
  { name: "To Do", color: "blue", borderColor: "border-blue-200", dotColor: "bg-blue-500", bgCol: "bg-blue-50/50" },
  { name: "In Progress", color: "amber", borderColor: "border-amber-200", dotColor: "bg-amber-500", bgCol: "bg-amber-50/50" },
  { name: "Done", color: "emerald", borderColor: "border-emerald-200", dotColor: "bg-emerald-500", bgCol: "bg-emerald-50/50" }
];

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  
  const [formData, setFormData] = useState({ title: "", notes: "", status: "To Do" });
  
  const [draggingId, setDraggingId] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await API.get("/todos");
      setTodos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    try {
      if (editingTodo) {
        await API.put(`/todos/${editingTodo._id}`, formData);
      } else {
        await API.post("/todos/add", formData);
      }
      setIsModalOpen(false);
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this task?")) return;
    try {
      await API.delete(`/todos/${id}`);
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id) => {
    try {
      const payload = { status: "Archived", completedAt: new Date() };
      
      setTodos(todos.map(t => t._id === id ? { ...t, ...payload } : t));
      await API.put(`/todos/${id}`, payload);
    } catch(err) {
      console.error(err);
      fetchTodos();
    }
  };

  const openAddModal = (status = "To Do") => {
    setFormData({ title: "", notes: "", status });
    setEditingTodo(null);
    setIsModalOpen(true);
  };

  const openEditModal = (todo) => {
    setFormData({ title: todo.title, notes: todo.notes || "", status: todo.status });
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  // Drag and drop handlers
  const onDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDraggingId(null);
    if (!id) return;
    
    // Optimistic UI update
    const task = todos.find(t => t._id === id);
    if (task && task.status !== targetStatus) {
      const updatedTodos = todos.map(t => t._id === id ? { ...t, status: targetStatus } : t);
      setTodos(updatedTodos);
      
      try {
        await API.put(`/todos/${id}`, { status: targetStatus });
      } catch (err) {
        console.error(err);
        fetchTodos(); 
      }
    }
  };

  const boardData = COLUMNS.map(col => ({
    ...col,
    tasks: todos.filter(t => t.status === col.name)
  }));

  const archivedTasks = todos.filter(t => t.status === "Archived").sort((a,b) => {
     const dateA = a.completedAt ? new Date(a.completedAt) : new Date(a.createdAt);
     const dateB = b.completedAt ? new Date(b.completedAt) : new Date(b.createdAt);
     return dateB - dateA;
  });

  return (
    <div className="min-h-screen p-6 font-sans bg-[#F8FAFC] text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8 mt-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">To-Do List</h1>
            <p className="text-slate-500 font-medium mt-1">Organize and manage your general tasks</p>
          </div>
          <button 
            onClick={() => openAddModal("To Do")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} strokeWidth={3} /> Add Task
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {boardData.map(col => (
            <div 
              key={col.name}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.name)}
              className={`rounded-2xl p-5 border shadow-sm min-h-[60vh] flex flex-col transition-colors border-slate-200 bg-white`}
            >
              <div className={`flex justify-between items-center mb-6 pb-4 border-b ${col.borderColor}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.dotColor}`}></div>
                  <h2 className={`text-lg font-bold text-slate-700`}>{col.name}</h2>
                </div>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                  {col.tasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-4">
                {col.tasks.map(task => (
                  <div 
                    key={task._id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task._id)}
                    className={`bg-white border border-slate-200 rounded-xl p-4 cursor-grab hover:border-blue-300 transition-all shadow-sm hover:shadow-md group flex gap-3 ${draggingId === task._id ? 'opacity-50 scale-95 ring-2 ring-blue-400' : ''}`}
                  >
                    <div className="mt-1 cursor-grab text-slate-300 group-hover:text-slate-400">
                      <GripVertical size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h3 className="font-bold text-slate-800 break-words leading-tight">{task.title}</h3>
                        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {col.name === "Done" && (
                            <button onClick={() => handleArchive(task._id)} title="Archive Task" className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                              <Archive size={16} />
                            </button>
                          )}
                          <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(task._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      {task.notes && (
                        <p className="text-slate-500 text-xs line-clamp-3 mt-1.5 font-medium leading-relaxed">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {col.tasks.length === 0 && (
                  <div className={`h-28 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/50`}>
                    <Plus size={20} className="mb-2 text-slate-300" />
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Archival Section */}
        {archivedTasks.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={22} />
              Previously Completed Tasks
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {archivedTasks.map(task => (
                <div key={task._id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-bold text-slate-500 line-through decoration-slate-400/60">{task.title}</h3>
                  </div>
                  {task.notes && (
                    <p className="text-slate-400 text-xs line-clamp-2 mt-2 font-medium">
                      {task.notes}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><CalendarIcon size={12}/> Completed</span>
                    <span className="text-emerald-600">{task.completedAt ? format(parseISO(task.completedAt), "MMM d, yyyy") : format(parseISO(task.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {editingTodo ? "Edit Task" : "Add New Task"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 rounded-full p-1.5">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Notes (Optional)</label>
                  <textarea
                    placeholder="Add any extra details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-400 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_8px] bg-[position:calc(100%-16px)_center] bg-no-repeat"
                  >
                    {COLUMNS.map(col => <option key={col.name} value={col.name}>{col.name}</option>)}
                  </select>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl py-2.5 font-bold transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-bold transition-all shadow-md focus:ring-4 focus:ring-indigo-100"
                  >
                    {editingTodo ? "Update Task" : "Save Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
