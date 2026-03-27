import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  TrendingUp,
  Flame,
  Plus,
  Award,
  Zap
} from "lucide-react";

import API from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [skills, setSkills] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);

  const [currentTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const headers = {
          Authorization: `Bearer ${token}`
        };

        const [progressRes, skillRes, taskRes] = await Promise.all([
          API.get("/progress", { headers }),
          API.get("/skills", { headers }),
          API.get("/tasks", { headers })
        ]);

        const progressData = progressRes.data;
        const skillData = skillRes.data;
        const taskData = taskRes.data;

        setProgress(progressData);
        setSkills(skillData);
        setTasks(taskData);

      } catch (err) {
        console.error(err);
        setError("Failed to fetch data. Your session may have expired (401). Please log in again.");
      }
    };

    fetchData();
  }, []);

  if (error) return <p className="p-6 text-red-500 font-bold">{error}</p>;
  if (!progress) return <p className="p-6">Loading...</p>;

  // --- Derived Data for UI ---
  // Study Time Metrics
  const dailyGoalHours = 6;
  const todayStudyTime = parseFloat((progress.totalStudyTime || 0).toFixed(1)); 
  const studyProgressPercent = Math.min(100, Math.round((todayStudyTime / dailyGoalHours) * 100));
  const remainingStudyTime = Math.max(0, dailyGoalHours - todayStudyTime).toFixed(1);

  // Tasks Metrics
  const dailyTaskGoal = 8;
  const todayTasksCompleted = progress.totalTasks || 0;
  const taskProgressPercent = Math.min(100, Math.round((todayTasksCompleted / dailyTaskGoal) * 100));
  const remainingTasks = Math.max(0, dailyTaskGoal - todayTasksCompleted);

  // Focus Score Metric
  const focusScore = Math.min(100, Math.max(0, Math.round((progress.overRunFactor || 0.85) * 100)));
  const focusLabel = focusScore >= 80 ? "Excellent" : focusScore >= 50 ? "Good" : "Needs Work";

  // --- Real Streak & Heatmap Calculation from Tasks ---
  const completedTasks = tasks.filter(t => t.status === "completed" && t.date);
  
  // Get unique dates (normalized to YYYY-MM-DD local time)
  const uniqueDatesSet = new Set(
    completedTasks.map(t => {
       const d = new Date(t.date);
       return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })
  );
  const activeDates = Array.from(uniqueDatesSet).sort(); // ascending

  let bestStreak = 0;
  let currentStreak = 0;

  if (activeDates.length > 0) {
    let currentRun = 1;
    bestStreak = 1;
    for (let i = 1; i < activeDates.length; i++) {
       const prevDate = new Date(activeDates[i-1]);
       const currDate = new Date(activeDates[i]);
       const diffTime = Math.abs(currDate - prevDate);
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       
       if (diffDays === 1) {
          currentRun++;
          if (currentRun > bestStreak) bestStreak = currentRun;
       } else {
          currentRun = 1;
       }
    }

    // Calculate current streak
    const todayStr = (() => {
       const d = new Date();
       return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();
    const yesterdayStr = (() => {
       const d = new Date();
       d.setDate(d.getDate() - 1);
       return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    let streakCheckDate = new Date(activeDates[activeDates.length - 1]);
    const lastDateStr = `${streakCheckDate.getFullYear()}-${String(streakCheckDate.getMonth()+1).padStart(2,'0')}-${String(streakCheckDate.getDate()).padStart(2,'0')}`;

    if (lastDateStr === todayStr || lastDateStr === yesterdayStr) {
       currentStreak = 1;
       let checkDate = new Date(streakCheckDate);
       checkDate.setDate(checkDate.getDate() - 1);
       
       while(true) {
         const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`;
         if (uniqueDatesSet.has(checkStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
         } else {
            break;
         }
       }
    }
  }

  // Real 7-Day Heatmap
  const heatmapData = [];
  for (let i = 6; i >= 0; i--) {
     const d = new Date();
     d.setDate(d.getDate() - i);
     const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
     const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
     
     // Calculate hours for this specific date
     let hours = 0;
     completedTasks.forEach(t => {
        const tDate = new Date(t.date);
        const tDateStr = `${tDate.getFullYear()}-${String(tDate.getMonth()+1).padStart(2,'0')}-${String(tDate.getDate()).padStart(2,'0')}`;
        if (tDateStr === dateStr) {
           let dur = t.planned_duration || 0;
           if (t.start_time && t.end_time) {
             const sMins = parseInt(t.start_time.split(':')[0]) * 60 + parseInt(t.start_time.split(':')[1]);
             const eMins = parseInt(t.end_time.split(':')[0]) * 60 + parseInt(t.end_time.split(':')[1]);
             let diff = eMins - sMins;
             if (diff < 0) diff += 24 * 60;
             dur = diff;
           }
           hours += (dur / 60);
        }
     });

     hours = parseFloat(hours.toFixed(1));

     let colorClass = "bg-gray-100 border border-gray-200"; 
     if (hours >= 4) colorClass = "bg-[#216e39] shadow-sm"; 
     else if (hours >= 2) colorClass = "bg-[#30a14e]"; 
     else if (hours >= 1) colorClass = "bg-[#40c463]"; 
     else if (hours > 0) colorClass = "bg-[#9be9a8]"; 

     heatmapData.push({ day: dayName, hours, colorClass, dateStr });
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 18) return "Good Afternoon!";
    return "Good Evening!";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500 rounded-xl shadow-inner text-white">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-bold text-indigo-600">Dashboard</h1>
                <span className="text-sm text-slate-400 font-medium">{currentTime}</span>
              </div>
              <p className="text-slate-600 mt-1 font-medium flex items-center gap-2">
                {getGreeting()} <span className="text-lg">✌️</span> <span className="text-slate-500">Ready to make today count?</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button onClick={() => navigate('/studyplan')} className="bg-indigo-500 hover:bg-indigo-600 shadow-md text-white rounded-xl px-5 py-2.5 h-auto font-semibold">
              <Plus className="mr-2 size-4 stroke-[3]" /> Add Task
            </Button>
            <Button onClick={() => navigate('/skills')} variant="outline" className="border-indigo-100 hover:bg-indigo-50 text-indigo-600 shadow-sm rounded-xl px-5 py-2.5 h-auto font-semibold">
              <Plus className="mr-2 size-4 stroke-[3]" /> Add Skill
            </Button>
          </div>
        </div>

        {/* Today's Study Overview */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700">
            <div className="p-1.5 bg-blue-100 rounded-md text-blue-500"><Clock size={16} /></div>
            Today's Study Overview
          </h2>
          
          <div className="grid md:grid-cols-3 gap-5">
            {/* Card 1: Total Study Time */}
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                    <Clock size={20} className="stroke-[2.5]"/>
                  </div>
                  <span className="text-xs font-bold bg-blue-50 text-blue-500 px-2.5 py-1 rounded-md">Today</span>
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">Total Study Time</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <h2 className="text-3xl font-extrabold text-blue-600">{todayStudyTime}h</h2>
                  <span className="text-slate-400 font-medium">/ {dailyGoalHours}h</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mb-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${studyProgressPercent}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-2">
                  {studyProgressPercent}% of daily goal • {remainingStudyTime}h remaining
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Tasks Completed */}
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl">
                    <CheckCircle2 size={20} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md">{taskProgressPercent}%</span>
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">Tasks Completed</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <h2 className="text-3xl font-extrabold text-emerald-500">{todayTasksCompleted}</h2>
                  <span className="text-slate-400 font-medium">/ {dailyTaskGoal}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mb-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${taskProgressPercent}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-2">
                  {remainingTasks} tasks remaining
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Focus Score */}
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl">
                    <Zap size={20} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-md">{focusLabel}</span>
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">Focus Score</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <h2 className="text-3xl font-extrabold text-purple-600">{focusScore}%</h2>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mb-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${focusScore}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-2">
                  Based on task completion & consistency
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Study Streak */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-orange-500">
            <Flame size={20} />
            Study Streak
          </h2>
          
          <div className="grid md:grid-cols-3 gap-5 bg-orange-50/50 p-2 rounded-3xl border border-orange-100">
            <Card className="border border-orange-100 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full space-y-2">
                <div className="text-orange-500 mt-2 mb-1 drop-shadow-sm">
                  <Flame size={48} className="fill-orange-100" />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-800">{currentStreak}</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Day Streak</p>
                <p className="text-xs text-orange-600 font-bold mt-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                   {currentStreak > 0 ? "🎉 Keep the streak alive!" : "Start your streak today!"}
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border border-orange-100 shadow-sm bg-white/80 backdrop-blur rounded-2xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-700">Last 7 Days (Activity)</h3>
                  <span className="text-xs font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">Best: {bestStreak} days</span>
                </div>
                
                {/* Custom Heatmap Grid */}
                <div className="flex justify-start md:justify-center items-end gap-3 mb-4 mt-2 overflow-x-auto pb-4 w-full">
                  {heatmapData.map((data, index) => (
                     <div key={index} className="flex flex-col items-center gap-3 shrink-0">
                       <div className="group relative">
                         {/* Heatmap Square */}
                         <div className={`w-10 h-10 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] transition-transform duration-200 hover:scale-110 cursor-pointer ${data.colorClass}`}></div>
                         
                         {/* Tooltip */}
                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                           {data.hours > 0 ? `${data.hours} hours` : "0 hours"} on {data.day}
                         </div>
                       </div>
                       <span className="text-[11px] font-bold text-slate-400">{data.day}</span>
                     </div>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-400 font-medium mt-6">
                  Study at least 30 minutes daily to maintain your streak.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Skill Progress */}
        <div className="space-y-4 mb-10 pb-10">
          <div className="flex justify-between items-center bg-white p-3 px-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-500">
              <div className="p-1.5 bg-indigo-50 rounded-md text-indigo-600"><Award size={16} /></div>
              Skill Progress
            </h2>
            <button className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full hover:bg-indigo-100 border border-indigo-100 transition-colors">
              View All Skills
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {skills.map((skill, index) => {
              const skillProgressObj = progress.skills?.find(s => s.name === skill.skill_name);
              const skillProgress = skillProgressObj ? skillProgressObj.progress : 0;
              const isEven = index % 2 === 0;
              
              return (
              <Card key={skill._id} className="border border-slate-100 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{skill.skill_name}</h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">{skill.category || 'Programming'} • {skillProgressObj?.hoursSpent || 0}h practiced</p>
                    </div>
                    <h2 className={`text-2xl font-extrabold ${isEven ? 'text-blue-600' : 'text-amber-500'}`}>{skillProgress}%</h2>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full mb-3 relative overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${isEven ? 'bg-blue-500' : 'bg-amber-400'}`}
                      style={{ width: `${skillProgress}%` }}
                    />
                    {/* Simulated milestones */}
                    <div className="absolute top-0 left-1/3 w-1 h-full bg-white/40"></div>
                    <div className="absolute top-0 left-2/3 w-1 h-full bg-white/40"></div>
                  </div>
                  
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <span className={isEven ? "text-emerald-500" : "text-amber-500"}>
                      {isEven ? "✨" : "🔥"}
                    </span>
                    {isEven ? "Great progress!" : "Keep it up!"}
                  </p>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>

      </div>
    </div>
  );
}