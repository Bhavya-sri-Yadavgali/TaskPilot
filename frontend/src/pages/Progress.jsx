import { useEffect, useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek, parseISO, isSameDay, startOfDay } from "date-fns";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip
} from "recharts";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  TrendingUp, 
  Clock, 
  Award, 
  Target, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import API from "../services/api";

const CATEGORY_COLORS = {
  "Programming": "#3b82f6", 
  "Languages": "#d946ef",   
  "Mathematics": "#10b981", 
  "Design": "#f43f5e",      
  "Science": "#06b6d4",     
  "System Design": "#0ea5e9", 
  "Other": "#94a3b8"        
};

export default function Progress() {
  const [tasks, setTasks] = useState([]);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState(null);
  
  // Week Selection State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      const token = localStorage.getItem("token");
      try {
        const [taskRes, skillRes] = await Promise.all([
          API.get("/tasks", { headers: { Authorization: `Bearer ${token}` } }),
          API.get("/skills", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setTasks(taskRes.data);
        setSkills(skillRes.data);
      } catch(err) {
        console.error(err);
        setError("Your session may have expired. Please log in again.");
      }
    };
    fetchAnalyticsData();
  }, []);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleCurrentWeek = () => setCurrentDate(new Date());

  const {
    lifetimeHours,
    lifetimeTasks,
    lifetimeDailyAvg,
    topSkillLifetime,
    
    // Week Specific
    weeklyStudyHours,
    weeklyChartData,
    weekCategoryData,
    weekSkillData
  } = useMemo(() => {
    
    // 1. Filter only completed tasks
    const completedTasks = tasks.filter(t => t.status === "completed" && t.date);

    // Lifetime Computations
    let totalLifetimeMins = 0;
    const skillLifetimeMins = {};
    
    completedTasks.forEach(t => {
      let dur = t.planned_duration || 0;
      // Recalculate duration if we just added start/end times in previous tasks
      if (t.start_time && t.end_time) {
        const sMins = parseInt(t.start_time.split(':')[0]) * 60 + parseInt(t.start_time.split(':')[1]);
        const eMins = parseInt(t.end_time.split(':')[0]) * 60 + parseInt(t.end_time.split(':')[1]);
        let diff = eMins - sMins;
        if (diff < 0) diff += 24 * 60;
        dur = diff;
      }
      
      totalLifetimeMins += dur;
      
      const skillId = typeof t.skill_id === 'object' && t.skill_id ? t.skill_id._id : t.skill_id;
      if (skillId) {
        skillLifetimeMins[skillId] = (skillLifetimeMins[skillId] || 0) + dur;
      }
    });

    const lifetimeHours = totalLifetimeMins / 60;
    
    let topSkillLifetime = null;
    let maxSkillMins = 0;
    Object.entries(skillLifetimeMins).forEach(([sId, mins]) => {
      if (mins > maxSkillMins) {
        maxSkillMins = mins;
        const skillObj = skills.find(s => s._id === sId);
        topSkillLifetime = skillObj ? skillObj.skill_name : "Unknown Skill";
      }
    });

    // Assume 30 days active for a rough daily average, or calculate first task
    const firstTaskDate = completedTasks.length > 0 
      ? new Date(Math.min(...completedTasks.map(t => new Date(t.date))))
      : new Date();
    const daysSinceStart = Math.max(1, Math.ceil((new Date() - firstTaskDate) / (1000 * 60 * 60 * 24)));
    const lifetimeDailyAvg = lifetimeHours / daysSinceStart;

    // --- Weekly Computations ---
    const weekStartObj = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEndObj = endOfWeek(currentDate, { weekStartsOn: 1 });
    
    const weekTasks = completedTasks.filter(t => {
      const taskDate = parseISO(t.date);
      return taskDate >= weekStartObj && taskDate <= weekEndObj;
    });

    let totalWeekMins = 0;
    const weekDayMins = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 };
    const catMap = {};
    const weekSkillMins = {};

    weekTasks.forEach(t => {
      let dur = t.planned_duration || 0;
      if (t.start_time && t.end_time) {
        const sMins = parseInt(t.start_time.split(':')[0]) * 60 + parseInt(t.start_time.split(':')[1]);
        const eMins = parseInt(t.end_time.split(':')[0]) * 60 + parseInt(t.end_time.split(':')[1]);
        let diff = eMins - sMins;
        if (diff < 0) diff += 24 * 60;
        dur = diff;
      }
      
      totalWeekMins += dur;
      
      const tDay = format(parseISO(t.date), "EEE"); // Mon, Tue...
      if (weekDayMins[tDay] !== undefined) {
        weekDayMins[tDay] += dur;
      }

      // Map skill & category
      const skillId = typeof t.skill_id === 'object' && t.skill_id ? t.skill_id._id : t.skill_id;
      let category = "Other";
      let skillName = "General";
      
      if (skillId) {
        const skillObj = skills.find(s => s._id === skillId);
        if (skillObj) {
          category = skillObj.category || "Other";
          skillName = skillObj.skill_name;
        }
      }
      
      catMap[category] = (catMap[category] || 0) + (dur / 60);
      weekSkillMins[skillName] = (weekSkillMins[skillName] || 0) + (dur / 60);
    });

    const weeklyStudyHours = totalWeekMins / 60;
    
    const weekOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyChartData = weekOrder.map(day => ({
      week: day,
      hours: weekDayMins[day] / 60
    }));

    const weekCategoryData = Object.keys(catMap).map(key => ({
      name: key,
      value: catMap[key],
      fill: CATEGORY_COLORS[key] || CATEGORY_COLORS["Other"]
    })).sort((a,b) => b.value - a.value);

    const weekSkillData = Object.keys(weekSkillMins).map(name => {
      const skillObj = skills.find(s => s.skill_name === name);
      return {
        name,
        category: skillObj ? skillObj.category : "Other",
        hoursSpent: weekSkillMins[name]
      };
    }).sort((a,b) => b.hoursSpent - a.hoursSpent);

    return {
      lifetimeHours,
      lifetimeTasks: completedTasks.length,
      lifetimeDailyAvg,
      topSkillLifetime,
      weeklyStudyHours,
      weeklyChartData,
      weekCategoryData,
      weekSkillData
    };
  }, [tasks, skills, currentDate]);

  if (error) return <p className="p-6 text-red-500 font-bold">{error}</p>;
  if (tasks.length === 0 && skills.length === 0) return <p className="p-6 text-slate-500 font-medium">Loading progress analytics...</p>;

  const weekStartStr = format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d");
  const weekEndStr = format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy");
  const isCurrentWeek = isSameWeek(currentDate, new Date(), { weekStartsOn: 1 });

  const weeklyGoal = 20; 
  const percentComplete = Math.min(Math.round((weeklyStudyHours / weeklyGoal) * 100), 100);
  const remainingHours = Math.max(weeklyGoal - weeklyStudyHours, 0);

  // SVG Circular Math
  const circleRadius = 70;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (percentComplete / 100) * circleCircumference;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-2">
           <div className="bg-indigo-500 p-2.5 rounded-xl shadow-inner text-white">
             <TrendingUp size={28} className="stroke-[2.5]" />
           </div>
           <div>
             <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
               Progress
             </h1>
             <p className="text-slate-500 font-medium mt-0.5">Visualize your learning progress</p>
           </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid md:grid-cols-3 gap-5">
           <Card className="border-none shadow-sm rounded-2xl bg-white">
             <CardContent className="p-5 flex justify-between items-start h-full">
               <div>
                 <p className="text-xs font-bold text-slate-400 mb-1">Total Hours Studied</p>
                 <h2 className="text-2xl font-extrabold text-blue-600 mb-1">{lifetimeHours.toFixed(1)}h</h2>
                 <p className="text-[10px] font-bold text-slate-300">Lifetime total</p>
               </div>
               <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                 <Clock size={20} className="stroke-[2.5]" />
               </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-2xl bg-white">
             <CardContent className="p-5 flex justify-between items-start h-full">
               <div>
                 <p className="text-xs font-bold text-slate-400 mb-1">Most Practiced</p>
                 <h2 className="text-lg font-extrabold text-purple-600 leading-tight mb-1 truncate max-w-[140px]">
                   {topSkillLifetime || "None"}
                 </h2>
                 <p className="text-[10px] font-bold text-slate-400">Lifetime top skill</p>
               </div>
               <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl">
                 <Award size={20} className="stroke-[2.5]" />
               </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-2xl bg-white">
             <CardContent className="p-5 flex justify-between items-start h-full">
               <div>
                 <p className="text-xs font-bold text-slate-400 mb-1">Daily Average</p>
                 <h2 className="text-2xl font-extrabold text-emerald-500 mb-1">{lifetimeDailyAvg.toFixed(1)}h</h2>
                 <p className="text-[10px] font-bold text-slate-300">Lifetime average</p>
               </div>
               <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl">
                 <Target size={20} className="stroke-[2.5]" />
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Week Selection Bar */}
        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <CalendarIcon size={16} className="text-blue-500" />
              Week Selection
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={handlePrevWeek} variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100">
                <ChevronLeft size={16} />
              </Button>
              <div className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-lg flex items-center gap-2 min-w-[150px] justify-center text-center shadow-sm">
                {weekStartStr} - {weekEndStr} 
              </div>
              <Button onClick={handleNextWeek} variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100">
                <ChevronRight size={16} />
              </Button>
            </div>

            {!isCurrentWeek ? (
              <Button onClick={handleCurrentWeek} className="text-xs h-8 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-sm font-bold">
                Jump to Current
              </Button>
            ) : (
                <div className="w-[110px]">
                    <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider block text-center">Current Week</span>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Main Charts Row */}
        <div className="grid md:grid-cols-2 gap-5">
          
          {/* Left: Circular Progress Goal Card */}
          <Card className="border-none shadow-sm rounded-2xl bg-white flex flex-col items-center justify-center p-8">
            <div className="relative flex items-center justify-center mb-6">
              {/* SVG Circle Background */}
              <svg width="200" height="200" className="transform -rotate-90">
                <circle
                  cx="100" cy="100" r={circleRadius} stroke="currentColor" strokeWidth="16" fill="transparent"
                  className="text-slate-100"
                />
                <circle
                  cx="100" cy="100" r={circleRadius} stroke="currentColor" strokeWidth="16" fill="transparent"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-blue-500 transition-all duration-1000 ease-in-out"
                />
              </svg>
              {/* Center Text */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-blue-600 leading-tight">{percentComplete}%</span>
                <span className="text-xs font-bold text-slate-400">Complete</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-800">
                {weeklyStudyHours.toFixed(1)}h <span className="text-slate-400 text-sm font-bold">/ {weeklyGoal}h</span>
              </h3>
              <p className="text-xs font-medium text-slate-400">studied this week</p>
            </div>

            <div className="flex items-center gap-6 text-xs font-bold text-slate-500 mb-6">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Studied {weeklyStudyHours.toFixed(1)}h
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div> Remaining {remainingHours.toFixed(1)}h
              </div>
            </div>

            <div className="bg-blue-50 text-blue-600 text-xs font-bold px-4 py-2 rounded-lg w-full text-center">
              {percentComplete >= 100 ? "💪 Amazing! Goal crushed!" : percentComplete >= 50 ? "🔥 Great work! You're over halfway there!" : "🚀 Keep pushing! You can do it!"}
            </div>
          </Card>

          {/* Right: Pie Chart Category Breakdown */}
          <Card className="border-none shadow-sm rounded-2xl bg-white p-8">
            <div className="relative h-[220px] flex justify-center items-center mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Pie
                    data={weekCategoryData}
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {weekCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl font-extrabold text-slate-800">{weeklyStudyHours.toFixed(1)}h</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Week</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4 max-h-[140px] overflow-y-auto">
              {weekCategoryData.length === 0 ? (
                <p className="text-xs text-slate-400 col-span-2 text-center">No category data for this week.</p>
              ) : (
                weekCategoryData.map(cat => {
                   const pct = weeklyStudyHours > 0 ? ((cat.value / weeklyStudyHours) * 100).toFixed(0) : 0;
                   return (
                     <div key={cat.name} className="flex justify-between items-center text-xs font-bold">
                       <div className="flex items-center gap-2 text-slate-600 truncate mr-2">
                         <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.fill }}></div>
                         <span className="truncate">{cat.name}</span>
                       </div>
                       <div className="flex gap-1 items-center shrink-0">
                         <span className="text-slate-800">{cat.value.toFixed(1)}h</span>
                         <span className="text-slate-400 font-medium">({pct}%)</span>
                       </div>
                     </div>
                   );
                })
              )}
            </div>
          </Card>

        </div>

        {/* Bottom Detailed Time Spent Breakdown */}
        <Card className="border-none shadow-sm rounded-2xl bg-white mb-10">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-8">
              <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                <TrendingUp size={14} className="stroke-[3]" />
              </div>
              Time Spent Breakdown (Selected Week)
            </h2>

            <div className="space-y-6">
              {weekSkillData.length === 0 ? (
                <p className="text-center text-slate-400 text-sm font-medium py-4">No skills practiced during this week.</p>
              ) : (
                weekSkillData.map((skill, index) => {
                  const pct = weeklyStudyHours > 0 ? (skill.hoursSpent / weeklyStudyHours) * 100 : 0;
                  const catColor = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.Other;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-end text-xs font-bold">
                        <span className="text-slate-600 text-sm">{skill.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: catColor }}>{skill.hoursSpent.toFixed(1)}h</span>
                          <span className="text-[10px] text-slate-400">({pct.toFixed(0)}%)</span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-in-out"
                          style={{ width: `${pct}%`, backgroundColor: catColor }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}