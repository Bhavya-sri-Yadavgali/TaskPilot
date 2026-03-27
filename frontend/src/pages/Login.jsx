import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { GraduationCap } from "lucide-react";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Login() {

  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await API.post("/auth/login", data);
      localStorage.setItem("token", res.data.token);
      alert("Login Successful");
      window.location.href = "/dashboard"; // hard redirect to clear state and re-mount App with correct token
    } catch (err) {
      alert(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">

      <Card className="w-full max-w-md shadow-lg">

        <CardHeader className="bg-blue-600 text-white text-center rounded-t-xl">
          <div className="flex justify-center items-center gap-2">
            <GraduationCap />
            <CardTitle>Student Login</CardTitle>
          </div>




          <div className="bg-blue-600 text-white p-5">
  Tailwind is working 🚀
</div>
        </CardHeader>

        <CardContent className="pt-6">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <input
              placeholder="Email"
              {...register("email")}
              className="border p-2 w-full rounded"
            />

            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="border p-2 w-full rounded"
            />

            <Button className="w-full bg-blue-600 text-white">
              Login
            </Button>

          </form>

        </CardContent>

      </Card>

    </div>



  );
}