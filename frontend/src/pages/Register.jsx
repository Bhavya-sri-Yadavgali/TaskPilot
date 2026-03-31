import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import { GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const countries = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "India",
  "Germany",
  "France",
  "Japan",
  "Brazil",
  "Other",
];

const roles = [
  "Student",
  "Self-Learner",
  "Working Professional",
  "Teacher",
  "Other",
];

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await API.post("/auth/register", {
        name: data.fullName,
        email: data.email,
        password: data.password,
        dailyAvailableHours: Number(data.dailyTargetHours) || 2,
        timeZone: "IST"
      });
      alert(res.data.message || "Registration Successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 p-6">

      <Card className="w-full max-w-3xl shadow-lg">

        <CardHeader className="text-center bg-blue-600 text-white rounded-t-xl">

          <div className="flex justify-center items-center gap-2">

            <GraduationCap />

            <CardTitle>Student Registration</CardTitle>

          </div>

        </CardHeader>

        <CardContent className="pt-6">

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >

            <input
              placeholder="Full Name"
              {...register("fullName", { required: true })}
              className="border p-2 w-full rounded"
            />

            {errors.fullName && (
              <p className="text-red-500 text-sm">
                Full name required
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-4">

              <input
                placeholder="Email"
                {...register("email", { required: true })}
                className="border p-2 rounded"
              />

              <input
                placeholder="Phone"
                {...register("phone", { required: true })}
                className="border p-2 rounded"
              />

            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <input
                type="date"
                {...register("dateOfBirth", { required: true })}
                className="border p-2 rounded"
              />

              <select
                {...register("country")}
                className="border p-2 rounded"
              >

                <option value="">Select Country</option>

                {countries.map((c) => (
                  <option key={c}>{c}</option>
                ))}

              </select>

            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <select
                {...register("role")}
                className="border p-2 rounded"
              >

                <option value="">Select Role</option>

                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}

              </select>

              <input
                placeholder="Field of Study"
                {...register("fieldOfStudy")}
                className="border p-2 rounded"
              />

            </div>

            <input
              type="number"
              placeholder="Daily Target Hours"
              {...register("dailyTargetHours")}
              className="border p-2 rounded w-full"
            />

            <div className="grid md:grid-cols-2 gap-4">

              <input
                type="password"
                placeholder="Password"
                {...register("password", { required: true })}
                className="border p-2 rounded"
              />

              <input
                type="password"
                placeholder="Confirm Password"
                {...register("confirmPassword", {
                  required: true,
                })}
                className="border p-2 rounded"
              />

            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white"
            >
              Register
            </Button>

          </form>

        </CardContent>

      </Card>

    </div>
  );
}