import { useEffect, useState, useRef } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO, startOfDay, isBefore } from "date-fns";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Calendar as CalendarIcon, 
  Target, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Circle,
  XCircle,
  Trash2,
  Edit2,
  AlertCircle
} from "lucide-react";
import API from "../services/api";

const PREDEFINED_CATEGORIES = [
  { id: "Programming", color: "blue" },
  { id: "Languages", color: "fuchsia" },
  { id: "Mathematics", color: "emerald" },
  { id: "Design", color: "rose" },
  { id: "Science", color: "cyan" }
];

export default function StudyPlan() {
  const [tasks, setTasks] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modals / Forms
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [actualHours, setActualHours] = useState("");
  const [actualMinutes, setActualMinutes] = useState("");
  
  const [error, setError] = useState(null);
  const dateInputRef = useRef(null);

  // Form State
  const [newTask, setNewTask] = useState({
    title: "",
    skill_id: "",
    start_time: "09:00",
    end_time: "10:00",
    useExisting: false,
    existingTaskId: ""
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedDate]); // Refresh date-specific contexts if needed, but we fetch all tasks

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [taskRes, skillRes] = await Promise.all([
        API.get("/tasks", { headers }),
        API.get("/skills", { headers })
      ]);
      setTasks(taskRes.data);
      setSkills(skillRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    }
  };

  // Helper: Get tasks specifically for the selected date
  const selectedTasks = tasks.filter(t => {
    if (!t.date) return false;
    const taskDate = parseISO(t.date);
    return isSameDay(taskDate, selectedDate);
  });
  
  // Sort tasks by start time
  selectedTasks.sort((a, b) => (a.start_time || "00:00").localeCompare(b.start_time || "00:00"));

  // Check if selected date is in the past (before today's start)
  const today = startOfDay(new Date());
  const selectedDayStart = startOfDay(selectedDate);
  const isPastDay = isBefore(selectedDayStart, today);

  // Derived unique tasks for "Existing Task" dropdown (templates)
  const uniqueTaskTemplates = [];
  const seenTitles = new Set();
  tasks.forEach(t => {
    if (!seenTitles.has(t.title)) {
      seenTitles.add(t.title);
      uniqueTaskTemplates.push(t);
    }
  });

  // Metrics
  const tasksToday = selectedTasks.length;
  const completedTasks = selectedTasks.filter(t => t.status === "completed").length;
  const totalMinutes = selectedTasks.reduce((acc, t) => {
    // compute duration from start and end time if planned_duration is not set, or prefer strictly computed
    const s = t.start_time || "00:00";
    const e = t.end_time || "00:00";
    const sMins = parseInt(s.split(':')[0]) * 60 + parseInt(s.split(':')[1]);
    const eMins = parseInt(e.split(':')[0]) * 60 + parseInt(e.split(':')[1]);
    let diff = eMins - sMins;
    if (diff < 0) diff += 24 * 60; // crossed midnight
    return acc + diff;
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Overlap Validation
  const checkOverlap = (start, end, excludeTaskId = null) => {
    return selectedTasks.some(t => {
      if (t._id === excludeTaskId) return false;
      const tStart = t.start_time || "00:00";
      const tEnd = t.end_time || "00:00";
      
      // Basic overlapping logic: (StartA < EndB) and (EndA > StartB)
      return (start < tEnd) && (end > tStart);
    });
  };

  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const handeDateChange = (e) => {
    if (e.target.value) {
      // Create date from YYYY-MM-DD local time
      const [y, m, d] = e.target.value.split("-");
      setSelectedDate(new Date(y, m - 1, d));
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setFormError("");

    if (newTask.start_time >= newTask.end_time) {
      setFormError("End time must be after start time.");
      return;
    }

    if (checkOverlap(newTask.start_time, newTask.end_time, isEditingTask)) {
      setFormError("This time slot overlaps with an existing task.");
      return;
    }

    let saveTitle = newTask.title;
    let saveSkill = newTask.skill_id;

    if (newTask.useExisting && newTask.existingTaskId) {
      const template = uniqueTaskTemplates.find(t => t._id === newTask.existingTaskId);
      if (template) {
        saveTitle = template.title;
        saveSkill = template.skill_id;
      }
    }

    if (!saveTitle.trim()) {
      setFormError("Task title is required.");
      return;
    }

    const sMins = parseInt(newTask.start_time.split(':')[0]) * 60 + parseInt(newTask.start_time.split(':')[1]);
    const eMins = parseInt(newTask.end_time.split(':')[0]) * 60 + parseInt(newTask.end_time.split(':')[1]);
    let duration = eMins - sMins;
    if (duration < 0) duration += 24 * 60;

    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: saveTitle,
        skill_id: saveSkill || null,
        start_time: newTask.start_time,
        end_time: newTask.end_time,
        planned_duration: duration,
        date: selectedDate.toISOString(),
        status: "pending"
      };

      if (isEditingTask) {
        await API.put(`/tasks/${isEditingTask}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await API.post("/tasks/add", payload, { headers: { Authorization: `Bearer ${token}` } });
      }

      setNewTask({ title: "", skill_id: "", start_time: "09:00", end_time: "10:00", useExisting: false, existingTaskId: "" });
      setIsAddingTask(false);
      setIsEditingTask(null);
      fetchData();
    } catch (err) {
      console.error("Save task failed", err);
      setFormError("Failed to save task. Please try again.");
    }
  };

  const handleEdit = (task) => {
    if (isPastDay || task.status === "completed") return;
    setIsEditingTask(task._id);
    setNewTask({
      title: task.title,
      skill_id: typeof task.skill_id === 'object' && task.skill_id ? task.skill_id._id : task.skill_id || "",
      start_time: task.start_time || "09:00",
      end_time: task.end_time || "10:00",
      useExisting: false,
      existingTaskId: ""
    });
    setIsAddingTask(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDelete = async (taskId) => {
    if (isPastDay) return;
    const task = selectedTasks.find(t => t._id === taskId);
    if (task && task.status === "completed") return;
    
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (task) => {
    if (isPastDay || task.status === "completed") return;
    
    // 🔥 Instead of immediate toggle, open completion modal
    setCompletingTask(task);
    const totalMins = task.planned_duration || 0;
    setActualHours(Math.floor(totalMins / 60).toString());
    setActualMinutes((totalMins % 60).toString());
  };

  const handleConfirmCompletion = async () => {
    if (!completingTask) return;
    
    try {
      const totalMinutes = (parseInt(actualHours) || 0) * 60 + (parseInt(actualMinutes) || 0);
      await API.put(`/tasks/${completingTask._id}`, { 
        status: "completed",
        actual_duration: totalMinutes,
        completed_at: new Date().toISOString()
      });
      setCompletingTask(null);
      fetchData();
    } catch (err) {
      console.error(err);
      setError("Failed to record completion.");
    }
  };

  const formatDurationBtn = (start, end) => {
    if (!start || !end) return "0h";
    const sMins = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const eMins = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    let diff = eMins - sMins;
    if (diff < 0) diff += 24 * 60;
    
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  if (error) return <p className="p-6 text-red-500 font-bold">{error}</p>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-2">
           <div className="bg-indigo-500 p-2.5 rounded-xl shadow-inner text-white">
             <CalendarIcon size={28} className="stroke-[2.5]" />
           </div>
           <div>
             <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
               Daily Study Planner
             </h1>
             <p className="text-slate-500 font-medium mt-0.5">Plan and track your daily study tasks</p>
           </div>
        </div>

        {/* Stats Row */}
        <div className="grid md:grid-cols-3 gap-5">
           <Card className="border-none shadow-sm rounded-2xl bg-white">
             <CardContent className="p-5 flex justify-between items-center h-full">
               <div>
                 <p className="text-sm font-bold text-slate-400 mb-1">Tasks Today</p>
                 <h2 className="text-3xl font-extrabold text-blue-600">{tasksToday}</h2>
               </div>
               <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                 <Target size={24} className="stroke-[2.5]" />
               </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-2xl bg-white">
             <CardContent className="p-5 flex justify-between items-center h-full">
               <div>
                 <p className="text-sm font-bold text-slate-400 mb-1">Completed</p>
                 <div className="flex items-baseline gap-1">
                   <h2 className="text-3xl font-extrabold text-emerald-500">{completedTasks}</h2>
                   <span className="text-lg font-bold text-emerald-300">/{tasksToday}</span>
                 </div>
               </div>
               <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                 <CheckCircle2 size={24} className="stroke-[2.5]" />
               </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-2xl bg-white">
             <CardContent className="p-5 flex justify-between items-center h-full">
               <div>
                 <p className="text-sm font-bold text-slate-400 mb-1">Total Hours</p>
                 <h2 className="text-3xl font-extrabold text-purple-600">{totalHours}h</h2>
               </div>
               <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
                 <Clock size={24} className="stroke-[2.5]" />
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Weekly Calendar Strip */}
        <Card className="border-none shadow-sm rounded-2xl bg-white relative">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-500" />
                Select Date
              </h2>
              
              <div className="relative">
                <button 
                  onClick={handleOpenCalendar}
                  className="text-xs font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2">
                  <CalendarIcon size={14} /> Full Calendar
                </button>
                <input 
                  type="date" 
                  ref={dateInputRef}
                  onChange={handeDateChange}
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  max="2099-12-31" 
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 md:gap-4 overflow-x-auto pb-4">
              {weekDays.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const dayName = format(day, "EEE"); 
                const dayNum = format(day, "d");    
                const isDayPast = isBefore(startOfDay(day), today);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                        setSelectedDate(day);
                        setIsAddingTask(false);
                        setIsEditingTask(null);
                    }}
                    className={`flex flex-col items-center justify-center min-w-[70px] py-3 rounded-2xl transition-all font-bold 
                      ${isSelected 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md transform scale-105' 
                        : isDayPast
                          ? 'bg-slate-50 border border-slate-100 text-slate-300 opacity-70 hover:bg-slate-100'
                          : 'bg-white border hover:bg-indigo-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'
                      }`}
                  >
                    <span className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-current'}`}>{dayName}</span>
                    <span className={`text-xl mt-1 ${isSelected ? 'text-white' : 'text-current'}`}>{dayNum}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs font-bold text-slate-400 mt-4">
              Showing tasks for <span className="text-blue-500">{format(selectedDate, "MMMM d, yyyy")}</span>
              {isPastDay && <span className="text-orange-500 ml-2">(Read-Only: Past modifications disabled to protect streak integrity)</span>}
            </p>
          </CardContent>
        </Card>

        {/* Visual Timetable Representation */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
             <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
               <Clock size={16} className="text-purple-500" /> Daily Timetable Visualization
             </h2>
             
             <div className="overflow-x-auto pb-4">
               <div className="relative w-full min-w-[600px] h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mt-6">
                {/* 24 Hour Grid Lines */}
                {Array.from({length: 24}).map((_, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-slate-200" style={{ left: `${(i / 24) * 100}%` }}>
                     <span className="absolute -top-5 -translate-x-1/2 text-[9px] font-bold text-slate-400">{i}:00</span>
                  </div>
                ))}
                
                {/* Render task blocks */}
                {selectedTasks.map(task => {
                  const sParts = (task.start_time || "00:00").split(':');
                  const eParts = (task.end_time || "00:00").split(':');
                  const startPercent = ((parseInt(sParts[0]) * 60 + parseInt(sParts[1])) / (24 * 60)) * 100;
                  const endPercent = ((parseInt(eParts[0]) * 60 + parseInt(eParts[1])) / (24 * 60)) * 100;
                  const width = Math.max(0, endPercent - startPercent);
                  
                  return (
                    <div 
                      key={task._id} 
                      className="absolute top-0 bottom-0 bg-blue-500/80 border-l-2 border-blue-600 hover:bg-blue-600 transition-colors group cursor-pointer"
                      style={{ left: `${startPercent}%`, width: `${width}%` }}
                    >
                       <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 transition-opacity">
                         {task.title} ({task.start_time} - {task.end_time})
                       </div>
                    </div>
                  );
                })}
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Task Table Section */}
        <div className="space-y-4">
          
          {!isPastDay && (
            <Button 
              onClick={() => {
                setIsAddingTask(!isAddingTask);
                setIsEditingTask(null);
                setNewTask({ title: "", skill_id: "", start_time: "09:00", end_time: "10:00", useExisting: false, existingTaskId: "" });
                setFormError("");
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md rounded-xl px-6 py-2">
              <Plus size={16} className="mr-2" /> {isAddingTask && !isEditingTask ? 'Cancel Adding' : 'Add New Task'}
            </Button>
          )}

          {/* Add/Edit Task Form */}
          {isAddingTask && !isPastDay && (
            <Card className="border-none shadow-sm border-blue-100 bg-white rounded-2xl animate-in fade-in slide-in-from-top-4">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  {isEditingTask ? <Edit2 size={16} className="text-blue-500" /> : <Plus size={16} className="text-blue-500" />}
                  {isEditingTask ? "Edit Task" : "Add Task to Schedule"}
                </h3>

                {formError && (
                  <div className="mb-4 bg-red-50 text-red-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={16} /> {formError}
                  </div>
                )}

                <form onSubmit={handleSaveTask} className="space-y-4">
                  {/* Option to use existing task or create manual */}
                  {!isEditingTask && (
                    <div className="flex items-center gap-4 mb-2 pb-2 border-b border-slate-100">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                        <input type="radio" checked={!newTask.useExisting} onChange={() => setNewTask({...newTask, useExisting: false})} className="accent-blue-500" />
                        Create Custom Task
                      </label>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                        <input type="radio" checked={newTask.useExisting} onChange={() => setNewTask({...newTask, useExisting: true})} className="accent-blue-500" />
                        Pick from Task History
                      </label>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    
                    {newTask.useExisting ? (
                      <div className="md:col-span-2">
                         <label className="text-xs font-bold text-slate-500 mb-1.5 block">Select Historic Task</label>
                         <select 
                           value={newTask.existingTaskId}
                           onChange={e => setNewTask({...newTask, existingTaskId: e.target.value})}
                           className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                           required
                         >
                           <option value="" disabled>Choose a previously created task</option>
                           {uniqueTaskTemplates.map(t => (
                             <option key={t._id} value={t._id}>{t.title} {t.skill_id && '(Skill Bound)'}</option>
                           ))}
                         </select>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1.5 block">Task Name</label>
                          <input type="text" placeholder="e.g. React Component Practice" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required={!newTask.useExisting} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1.5 block">Skill Association (Optional)</label>
                          <select value={newTask.skill_id} onChange={e => setNewTask({...newTask, skill_id: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                            <option value="">None / General Tracking</option>
                            {skills.map(s => <option key={s._id} value={s._id}>{s.skill_name}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Start Time <span className="text-[10px] text-orange-400 font-normal">(Prevents Overlaps)</span></label>
                      <input type="time" value={newTask.start_time} onChange={e => setNewTask({...newTask, start_time: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">End Time</label>
                      <input type="time" value={newTask.end_time} onChange={e => setNewTask({...newTask, end_time: e.target.value})} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsAddingTask(false)}
                      className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors font-bold"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2 shadow-md">
                      {isEditingTask ? "Update Schedule" : "Save to Schedule"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Table Card */}
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm grid grid-cols-12 gap-4 px-6 py-4 items-center">
              <div className="col-span-3 md:col-span-2">Time Slot</div>
              <div className="col-span-4 md:col-span-4">Task Name</div>
              <div className="col-span-3 md:col-span-2 hidden md:block">Skill</div>
              <div className="col-span-2 md:col-span-2 hidden md:block">Duration</div>
              <div className="col-span-5 md:col-span-2 text-right md:text-left">Status</div>
            </div>

            <div className="divide-y divide-slate-100">
              {selectedTasks.length === 0 ? (
                <p className="text-center text-slate-400 py-10 font-medium">No tasks planned for this day. Free time!</p>
              ) : (
                selectedTasks.map((task) => {

                  let bgBadge = 'bg-slate-100';
                  let textBadge = 'text-slate-500';
                  
                  if (task.skill_id && task.skill_id.category) {
                    const knownCat = PREDEFINED_CATEGORIES.find(c => c.id === task.skill_id.category);
                    if (knownCat) {
                      const color = knownCat.color;
                      if (color === 'blue') { bgBadge = 'bg-blue-50'; textBadge = 'text-blue-600'; }
                      else if (color === 'fuchsia') { bgBadge = 'bg-fuchsia-50'; textBadge = 'text-fuchsia-600'; }
                      else if (color === 'emerald') { bgBadge = 'bg-emerald-50'; textBadge = 'text-emerald-600'; }
                      else if (color === 'rose') { bgBadge = 'bg-rose-50'; textBadge = 'text-rose-600'; }
                      else if (color === 'cyan') { bgBadge = 'bg-cyan-50'; textBadge = 'text-cyan-600'; }
                    }
                  }

                  const isCompleted = task.status === "completed";
                  const isMissed = task.status === "missed" || (selectedDate < new Date().setHours(0,0,0,0) && !isCompleted);
                  
                  return (
                    <div key={task._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group relative">
                      <div className="col-span-3 md:col-span-2 text-xs font-bold text-slate-500 flex items-center gap-1.5 break-words">
                        <Clock size={12} className="shrink-0" />
                        {task.start_time} - {task.end_time}
                      </div>

                      <div className="col-span-4 md:col-span-4 text-sm font-bold text-slate-800 break-words flex flex-col">
                        <span>{task.title}</span>
                      </div>

                      <div className="col-span-3 md:col-span-2 hidden md:block">
                        {task.skill_id ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${bgBadge} ${textBadge}`}>
                            {task.skill_id.category || 'Skill'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 px-2 border border-slate-100 rounded-md">General</span>
                        )}
                      </div>

                      <div className="col-span-2 md:col-span-2 hidden md:block text-xs font-bold text-slate-400">
                        {formatDurationBtn(task.start_time, task.end_time)}
                      </div>

                      <div className="col-span-5 md:col-span-2 text-right md:text-left flex md:justify-start justify-end items-center gap-2">
                        {/* Status Toggle Button */}
                        <button 
                          onClick={() => toggleStatus(task)}
                          disabled={isPastDay || isCompleted}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border transition-all ${
                            isCompleted 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 opacity-90'
                              : isMissed
                                ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                                : 'bg-blue-50/50 text-blue-500 border-blue-200 hover:bg-blue-50'
                          } ${(isPastDay || isCompleted) ? 'cursor-not-allowed' : ''}`}
                        >
                          {isCompleted ? <CheckCircle2 size={14} /> : isMissed ? <XCircle size={14} /> : <Circle size={14} />}
                          {isCompleted ? "Completed" : isMissed ? "Missed" : "Planned"}
                        </button>
                        
                        {!isPastDay && !isCompleted && (
                          <div className="md:opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                            <button onClick={() => handleEdit(task)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(task._id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* --- Task Completion Modal --- */}
        {completingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-sm bg-white shadow-2xl rounded-[2rem] overflow-hidden border-none transform animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} strokeWidth={2.5} />
                </div>
                
                <h2 className="text-xl font-extrabold text-slate-800 mb-2">Great Job!</h2>
                <p className="text-slate-500 text-sm font-medium mb-8">
                  You finished <span className="text-indigo-600 font-bold">"{completingTask.title}"</span>. 
                  How much time did it take?
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="relative">
                    <label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hours</label>
                    <input 
                      type="number" 
                      min="0"
                      autoFocus
                      value={actualHours}
                      onChange={(e) => setActualHours(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-2xl font-black text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-center"
                    />
                  </div>
                  <div className="relative">
                    <label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes</label>
                    <input 
                      type="number" 
                      min="0"
                      max="59"
                      value={actualMinutes}
                      onChange={(e) => setActualMinutes(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-2xl font-black text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-center"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setCompletingTask(null)}
                    type="button"
                    className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-2xl py-4 h-auto font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <Button 
                    onClick={handleConfirmCompletion}
                    className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 rounded-2xl py-4 h-auto font-bold transition-all transform active:scale-95"
                  >
                    Complete
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}