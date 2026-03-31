import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Globe, 
  Briefcase, 
  BookOpen, 
  Clock, 
  Lock, 
  ArrowRight 
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import API from "../services/api";

const countries = [
  "United States", "United Kingdom", "Canada", "Australia", 
  "India", "Germany", "France", "Japan", "Brazil", "Other"
];

const roles = [
  "Student", "Self-Learner", "Working Professional", "Teacher", "Other"
];

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await API.post("/auth/register", {
        name: data.fullName,
        email: data.email,
        password: data.password,
        dailyAvailableHours: Number(data.dailyTargetHours) || 2,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      });
      // success case
      navigate("/login");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const InputWrapper = ({ label, icon: Icon, children, error }) => (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
          <Icon size={18} />
        </div>
        {children}
      </div>
      {error && <p className="text-[10px] text-red-400 font-bold ml-1 uppercase tracking-wider">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4ff] font-sans flex flex-col items-center py-12 px-4 relative">
      <Card className="w-full max-w-4xl border-none shadow-xl bg-white overflow-hidden rounded-2xl mb-8">
        <CardHeader className="text-center p-0">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex justify-center items-center gap-3 mb-2">
              <GraduationCap size={32} className="text-yellow-400 fill-yellow-400/20" />
              <h1 className="text-3xl font-bold tracking-tight">Student Registration</h1>
            </div>
            <p className="text-blue-100 text-sm font-medium mt-1 opacity-90">Join our learning community and start your educational journey</p>
            <p className="text-white/90 text-xs mt-3 italic">"Every expert was once a beginner. Your learning journey starts today!" ✨</p>
          </div>
        </CardHeader>

        <CardContent className="p-8 md:p-10 pt-10">
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-bold text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <input
                placeholder="Enter your full name"
                {...register("fullName", { required: true })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {errors.fullName && <p className="text-xs text-red-500 mt-1 ml-1 font-medium italic">Full name is required</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  {...register("email", { required: true })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                <input
                  placeholder="+1 (555) 123-4567"
                  {...register("phone")}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth</label>
                <input
                  type="date"
                  {...register("dateOfBirth")}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-400 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Country</label>
                <select
                  {...register("country")}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-500"
                >
                  <option value="">Select your country</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Role</label>
                <select
                  {...register("role")}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-500"
                >
                  <option value="">Select Role</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Field of Study</label>
                <input
                  placeholder="e.g. Computer Science"
                  {...register("fieldOfStudy")}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Daily Target Hours</label>
              <input
                type="number"
                placeholder="2"
                {...register("dailyTargetHours")}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password", { required: true })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword", { required: true })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#4f46e5] to-[#9333ea] hover:from-[#4338ca] hover:to-[#7e22ce] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
              >
                {isLoading ? "Signing up..." : "🎓 Register Now"}
              </Button>
            </div>

            <div className="text-center text-sm pt-2">
              <p className="text-slate-500 flex items-center justify-center gap-2">
                Already have an account? 
                <Link to="/login" className="text-purple-600 font-bold hover:underline transition-all underline-offset-4">Sign in here</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* FOOTER BAR as per screenshot */}
      <div className="w-full absolute bottom-0 bg-gradient-to-r from-[#4f46e5] to-[#9333ea] py-4 text-center">
        <p className="text-white text-sm font-medium">
          Built with <span className="animate-pulse">❤️</span> by <a href="https://www.linkedin.com/in/bhavya-sri-yadavgali-a681322a3/" target="_blank" rel="noopener noreferrer" className="font-bold text-yellow-300 hover:text-yellow-400 transition-colors cursor-pointer">BhavYeah!!</a> | © 2026 All rights reserved.
        </p>
      </div>
    </div>
  );
}