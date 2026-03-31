import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";

export default function FocusSession() {
  
  // 🔒 Data Isolation: Prefix keys with userId
  const getUserId = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "guest";
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || "guest";
    } catch (e) {
      return "guest";
    }
  };
  const uId = getUserId();
  const k = (key) => `${uId}_${key}`;

  // State Initialization from LocalStorage
  const [durationLimit, setDurationLimit] = useState(() => {
    const saved = localStorage.getItem(k("focus_duration"));
    return saved !== null ? parseInt(saved) : 25 * 60;
  });
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem(k("focus_timeLeft"));
    return saved !== null ? parseInt(saved) : 25 * 60;
  });
  
  const [isActive, setIsActive] = useState(() => {
    return localStorage.getItem(k("focus_isActive")) === "true";
  });
  
  const [customMinutes, setCustomMinutes] = useState("");
  const timerRef = useRef(null);

  // Sync fundamental state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem(k("focus_duration"), durationLimit);
    localStorage.setItem(k("focus_timeLeft"), timeLeft);
    localStorage.setItem(k("focus_isActive"), isActive);
  }, [durationLimit, timeLeft, isActive]);

  // Main Timer Interval
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      
      // If we just became active or loaded the page, ensure endTime is reliable
      const savedEndTime = localStorage.getItem(k("focus_endTime"));
      let endTime;
      
      if (!savedEndTime) {
         endTime = Date.now() + timeLeft * 1000;
         localStorage.setItem(k("focus_endTime"), endTime);
      } else {
         endTime = parseInt(savedEndTime);
         // Correct time left immediately upon activation/reload
         const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
         setTimeLeft(remaining);
      }
      
      timerRef.current = setInterval(() => {
        const currentRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(currentRemaining);
        
        if (currentRemaining <= 0) {
          clearInterval(timerRef.current);
          setIsActive(false);
          localStorage.removeItem(k("focus_endTime"));
          playAlarm();
        }
      }, 1000);
      
    } else {
       // Clear interval and remove endTime mark when paused or stopped
       clearInterval(timerRef.current);
       localStorage.removeItem(k("focus_endTime"));
    }
    
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  const playAlarm = () => {
     // Optional: Play a sound when focusing ends
     console.log("Session complete!");
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    clearInterval(timerRef.current);
    localStorage.removeItem(k("focus_endTime"));
    setTimeLeft(durationLimit);
  };

  const changeDuration = (mins) => {
    setIsActive(false);
    clearInterval(timerRef.current);
    localStorage.removeItem(k("focus_endTime"));
    
    const newSeconds = Math.max(1, mins * 60);
    setDurationLimit(newSeconds);
    setTimeLeft(newSeconds);
  };

  const handleCustomDurationSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      changeDuration(mins);
      setCustomMinutes("");
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine progress percentage for animation logic
  const progressPercent = ((durationLimit - timeLeft) / Math.max(durationLimit, 1)) * 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 text-slate-800 font-sans flex flex-col items-center pt-16">
      
      <div className="w-full max-w-lg">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-[#1e293b] tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent inline-block">Focus Session</h1>
          <p className="text-slate-500 font-medium mt-2">Eliminate distractions and stay productive</p>
        </div>
        
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 flex flex-col items-center relative overflow-hidden">
          
          {/* Subtle background ring for design consistency */}
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>
          
          {/* Timer Display */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-10 z-10">
            {/* Spinning Gradient Ring */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-blue-200 via-indigo-500 to-emerald-400 p-[6px] shadow-lg ${isActive ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
               <div className={`w-full h-full bg-white rounded-full flex items-center justify-center ${isActive ? 'animate-[spin_6s_linear_infinite_reverse]' : ''}`}>
                 <h2 
                   className="text-[4rem] sm:text-[5.5rem] font-extrabold text-slate-800 tracking-tighter" 
                   style={{ fontFamily: "'Inter', sans-serif" }}>
                   {formatTime(timeLeft)}
                 </h2>
               </div>
            </div>
            
            {/* Circular Progress Path Overlay if needed, handled by simple spinning gradient for now */}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-10 z-10 w-full justify-center">
            <button 
              onClick={toggleTimer}
              className="flex items-center justify-center gap-2 flex-1 max-w-[200px] h-14 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all bg-gradient-to-r from-blue-600 to-indigo-600 focus:ring-4 focus:ring-indigo-100"
            >
              {isActive ? <Pause fill="currentColor" stroke="none" size={24} /> : <Play fill="currentColor" stroke="none" size={24} />}
              {isActive ? "Pause" : "Start Focus"}
            </button>

            <button 
              onClick={resetTimer}
              className="w-14 h-14 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 shadow-sm transition-all focus:ring-4 focus:ring-slate-100"
              title="Reset Timer"
            >
              <RotateCcw size={22} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Time Picker Controls */}
          <div className="w-full flex justify-center flex-wrap gap-2 lg:gap-3 z-10">
            {[15, 25, 45].map(mins => {
              const isSelected = durationLimit === mins * 60;
              return (
                <button
                  key={mins}
                  onClick={() => changeDuration(mins)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500 shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {mins} min
                </button>
              )
            })}
          </div>

          {/* Custom Time Input */}
          <form onSubmit={handleCustomDurationSubmit} className="mt-6 w-full flex items-center justify-center gap-2 z-10">
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="number"
                min="1"
                max="999"
                placeholder="Custom (min)"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-36 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <button 
              type="submit"
              disabled={!customMinutes}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Set
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
