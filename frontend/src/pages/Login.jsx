import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { GraduationCap, Mail, Lock, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import API from "../services/api";

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await API.post("/auth/login", data);
      localStorage.setItem("token", res.data.token);
      // Hard redirect to ensure state is cleared and layout re-mounts
      window.location.href = "/dashboard";
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4ff] font-sans flex flex-col items-center justify-center py-12 px-4 relative">
      <Card className="w-full max-w-md border-none shadow-xl bg-white overflow-hidden rounded-2xl mb-8">
        <CardHeader className="text-center p-0">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex justify-center items-center gap-3 mb-2">
              <GraduationCap size={32} className="text-yellow-400 fill-yellow-400/20" />
              <h1 className="text-3xl font-bold tracking-tight">Student Login</h1>
            </div>
            <p className="text-blue-100 text-sm font-medium mt-1 opacity-90">Small steps today, big results tomorrow.</p>
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
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="student@example.com"
                  {...register("email", { required: true })}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password", { required: true })}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#4f46e5] to-[#9333ea] hover:from-[#4338ca] hover:to-[#7e22ce] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
            >
              {isLoading ? "Signing in..." : "🎓 Login"}
            </Button>

            <div className="text-center text-sm pt-2">
              <p className="text-slate-500 flex items-center justify-center gap-2">
                Not registered yet?
                <Link to="/register" className="text-purple-600 font-bold hover:underline transition-all underline-offset-4">Create an account</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* FOOTER BAR as per screenshot */}
      <div className="w-full absolute bottom-0 bg-gradient-to-r from-[#4f46e5] to-[#9333ea] py-4 text-center">
        <p className="text-white text-sm font-medium">
          Built with <span className="animate-pulse">❤️</span> by <a href="https://www.linkedin.com/in/gali-bhavyasri/" target="_blank" rel="noopener noreferrer" className="font-bold text-yellow-300 hover:text-yellow-400 transition-colors cursor-pointer">BhavYeah!!</a> | © 2026 All rights reserved.
        </p>
      </div>
    </div>
  );
}