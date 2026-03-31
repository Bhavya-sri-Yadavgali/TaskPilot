import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Target, BookOpen, Award, Plus, Trash2, Edit2, X } from "lucide-react";
import API from "../services/api";

const PREDEFINED_CATEGORIES = [
  { id: "Programming", label: "Programming", color: "blue" },
  { id: "Languages", label: "Languages", color: "fuchsia" },
  { id: "Mathematics", label: "Mathematics", color: "emerald" },
  { id: "Design", label: "Design", color: "rose" },
  { id: "Science", label: "Science", color: "cyan" }
];

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    skill_name: "",
    category: "",
    customCategory: "",
    target_level: "beginner",
    priority: "medium",
    weeklyTargetedHours: 5
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [skillRes, progressRes] = await Promise.all([
        API.get("/skills", { headers }),
        API.get("/progress/raw", { headers })
      ]);
      setSkills(skillRes.data);
      setProgress(progressRes.data);
    } catch (err) {
      console.error(err);
      setError("Your session may have expired (401). Please log in again.");
    }
  };

  const getProgress = (skillId) => {
    const p = progress.find(p => p.skill_id === skillId);
    return p ? p.completed_hours : 0;
  };

  const openAddModal = () => {
    setFormData({
      skill_name: "",
      category: "",
      customCategory: "",
      target_level: "beginner",
      priority: "medium",
      weeklyTargetedHours: 5
    });
    setEditingSkill(null);
    setIsModalOpen(true);
  };

  const openEditModal = (skill) => {
    const isPredefined = PREDEFINED_CATEGORIES.some(c => c.id === skill.category);
    setFormData({
      skill_name: skill.skill_name || "",
      category: isPredefined ? skill.category : "Custom",
      customCategory: isPredefined ? "" : skill.category,
      target_level: skill.target_level || "beginner",
      priority: skill.priority || "medium",
      weeklyTargetedHours: skill.weeklyTargetedHours || 5
    });
    setEditingSkill(skill);
    setIsModalOpen(true);
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/skills/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.skill_name.trim()) return;

    const finalCategory = formData.category === "Custom"
      ? formData.customCategory.trim() || "Other"
      : formData.category || "Other";

    setIsAdding(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        skill_name: formData.skill_name,
        category: finalCategory,
        target_level: formData.target_level,
        priority: formData.priority,
        weeklyTargetedHours: Number(formData.weeklyTargetedHours) || 5
      };

      if (editingSkill) {
        await API.put(`/skills/${editingSkill._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await API.post("/skills/add", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setIsModalOpen(false);
      await fetchData(); // Refresh list
    } catch (err) {
      console.error("Failed to save skill", err);
    } finally {
      setIsAdding(false);
    }
  };

  if (error) return <p className="p-6 text-red-500 font-bold">{error}</p>;

  // Compute Stats
  const totalSkills = skills.length;
  let totalPercent = 0;
  let masteredCount = 0;

  const skillsWithProgress = skills.map(skill => {
    const hours = getProgress(skill._id);
    const target = skill.weeklyTargetedHours || 5;
    const percent = Math.min(Math.round((hours / target) * 100), 100);

    totalPercent += percent;
    if (percent >= 100) masteredCount++;

    // Assign color based on category
    const knownCat = PREDEFINED_CATEGORIES.find(c => c.id === skill.category);
    const colorTheme = knownCat ? knownCat.color : "slate";

    return { ...skill, hours, percent, colorTheme, target };
  });

  const avgProgress = totalSkills > 0 ? Math.round(totalPercent / totalSkills) : 0;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans relative">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500 p-2.5 rounded-xl shadow-inner text-white">
              <Award size={28} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                Skill Manager
              </h1>
              <p className="text-slate-500 font-medium mt-0.5">
                {totalSkills > 0 
                  ? "Master new capabilities and track your progress daily" 
                  : "Track and master your learning journey effortlessly"}
              </p>
            </div>
          </div>
          <Button onClick={openAddModal} className="bg-indigo-500 hover:bg-indigo-600 shadow-md text-white rounded-xl px-5 py-2.5 h-auto font-semibold shrink-0">
            <Plus className="mr-2 size-4 stroke-[3]" /> Add Skill
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-5">
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5 flex justify-between items-center h-full">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">Total Skills</p>
                <h2 className="text-3xl font-extrabold text-blue-600">{totalSkills}</h2>
              </div>
              <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                <Target size={24} className="stroke-[2.5]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5 flex justify-between items-center h-full">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">Avg Progress</p>
                <h2 className="text-3xl font-extrabold text-purple-600">{avgProgress}%</h2>
              </div>
              <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
                <BookOpen size={24} className="stroke-[2.5]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5 flex justify-between items-center h-full">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">Mastered</p>
                <h2 className="text-3xl font-extrabold text-emerald-500">{masteredCount}</h2>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                <Award size={24} className="stroke-[2.5]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Skills Grid */}
        <div className="pt-2">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Your Skills</h2>
            <p className="text-slate-500 text-sm font-medium">
              {totalSkills > 0 
                ? "Monitor your progress across all learning areas" 
                : "No skills added yet. Let's get started!"}
            </p>
          </div>

          {totalSkills === 0 ? (
            <Card className="border-2 border-dashed border-slate-200 shadow-none rounded-3xl bg-white/50 p-12 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                  <Award size={40} className="stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to learn something new?</h3>
                  <p className="text-slate-500 text-sm font-medium">
                    Adding skills helps you organize your learning path and track exactly how much time you're investing in your growth.
                  </p>
                </div>
                <Button 
                  onClick={openAddModal} 
                  className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-8 py-3 h-auto font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="mr-2 size-4 stroke-[3]" /> Add New Skill
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
            {skillsWithProgress.map((skill) => {

              // Safe static Tailwind class maps for Badges
              let bgBadge, textBadge;
              switch (skill.colorTheme) {
                case 'blue':
                  bgBadge = 'bg-blue-50'; textBadge = 'text-blue-600';
                  break;
                case 'fuchsia':
                  bgBadge = 'bg-fuchsia-50'; textBadge = 'text-fuchsia-600';
                  break;
                case 'emerald':
                  bgBadge = 'bg-emerald-50'; textBadge = 'text-emerald-600';
                  break;
                case 'rose':
                  bgBadge = 'bg-rose-50'; textBadge = 'text-rose-600';
                  break;
                case 'cyan':
                  bgBadge = 'bg-cyan-50'; textBadge = 'text-cyan-600';
                  break;
                default:
                  bgBadge = 'bg-slate-50'; textBadge = 'text-slate-600';
                  break;
              }

              // Progress Bar Color explicitly matches UI based on percentage score
              let bgBar = 'bg-amber-400';
              if (skill.percent >= 80) bgBar = 'bg-emerald-500';
              else if (skill.percent >= 50) bgBar = 'bg-blue-500';

              return (
                <Card key={skill._id} className="border-none shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow group">
                  <CardContent className="p-6 relative">

                    {/* Action Buttons (visible on hover) */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => openEditModal(skill)} className="p-1.5 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteSkill(skill._id)} className="p-1.5 bg-red-50 text-red-500 hover:text-red-700 rounded-lg"><Trash2 size={14} /></button>
                    </div>

                    <div className="mb-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${bgBadge} ${textBadge}`}>
                        {skill.category || 'Other'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-6 pr-12">
                      {skill.skill_name}
                    </h3>

                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-slate-400">Progress</span>
                      <span className="text-sm font-extrabold text-slate-700">{skill.percent}%</span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full mb-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${bgBar}`}
                        style={{ width: `${skill.percent}%` }}
                      ></div>
                    </div>

                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-4">
                      {skill.percent >= 100 ? (
                        <><span className="text-emerald-500">🎉</span> Mastered!</>
                      ) : skill.percent >= 50 ? (
                        <><span className="text-blue-500">✨</span> Making great progress</>
                      ) : (
                        <><span className="text-orange-500">🚀</span> Keep going!</>
                      )}
                    </p>

                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Unified Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden border-none relative">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {editingSkill ? <Edit2 size={18} className="text-indigo-500" /> : <Plus size={18} className="text-indigo-500" />}
                {editingSkill ? "Edit Skill" : "Add New Skill"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Skill Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Python Programming"
                    value={formData.skill_name}
                    onChange={(e) => setFormData({...formData, skill_name: e.target.value})}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-slate-400 text-slate-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-600 appearance-none"
                      required
                    >
                      <option value="" disabled>Select category</option>
                      {PREDEFINED_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                      <option value="Custom">Custom...</option>
                    </select>
                  </div>
                  
                  {formData.category === "Custom" ? (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Custom Category</label>
                      <input
                        type="text"
                        placeholder="Enter category"
                        value={formData.customCategory}
                        onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-700"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Target Level</label>
                      <select
                        value={formData.target_level}
                        onChange={(e) => setFormData({...formData, target_level: e.target.value})}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-600 appearance-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {formData.category === "Custom" && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Target Level</label>
                      <select
                        value={formData.target_level}
                        onChange={(e) => setFormData({...formData, target_level: e.target.value})}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-600 appearance-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-600 appearance-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div className={formData.category === "Custom" ? "col-span-2" : ""}>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Weekly Target (Hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      placeholder="e.g., 5"
                      value={formData.weeklyTargetedHours}
                      onChange={(e) => setFormData({...formData, weeklyTargetedHours: e.target.value})}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-700"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl py-2.5 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isAdding}
                    className="flex-[2] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl py-2.5 h-auto shadow-md font-semibold transition-all"
                  >
                    {isAdding ? "Saving..." : editingSkill ? "Update Skill" : "Add Skill"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}