import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Brain, Calendar, Timer, ListTodo, X, LogOut, TrendingUp } from "lucide-react";

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20}/> },
    { name: "Skill Manager", path: "/skills", icon: <Brain size={20}/> },
    { name: "Study Planner", path: "/studyplan", icon: <Calendar size={20}/> },
    { name: "Progress", path: "/progress", icon: <TrendingUp size={20}/> },
    { name: "Focus Session", path: "/focus", icon: <Timer size={20}/> },
    { name: "To-Do List", path: "/todos", icon: <ListTodo size={20}/> },
  ];

  return (
    <div className={`
      w-64 h-screen bg-blue-600 text-white p-6 fixed top-0 left-0 z-40
      transform transition-transform duration-300 ease-in-out
      md:translate-x-0 ${isOpen ? 'translate-x-0 overflow-y-auto' : '-translate-x-full'}
      flex flex-col justify-between
    `}>
      <div>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold">Study Tracker</h1>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden p-1.5 hover:bg-blue-500 rounded-lg transition"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              location.pathname === item.path
                ? "bg-white text-blue-600 shadow-sm"
                : "hover:bg-blue-500"
            }`}
          >
            {item.icon}
            <span className="font-semibold">{item.name}</span>
          </Link>
        ))}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 rounded-lg transition hover:bg-red-500 text-red-100 mt-auto border border-red-400 border-opacity-20"
      >
        <LogOut size={20} />
        <span className="font-semibold">Logout</span>
      </button>
    </div>
  );
}

export default Sidebar;