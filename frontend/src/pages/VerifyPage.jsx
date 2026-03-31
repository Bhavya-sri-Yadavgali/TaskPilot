import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export default function VerifyPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/verify/${token}`);
        setStatus("success");
        setMessage(res.data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "verifying" && <p>Verifying your email...</p>}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto text-green-500" size={48} />
              <p className="text-green-600 font-medium">{message}</p>
              <Button onClick={() => navigate("/login")} className="w-full bg-blue-600">Go to Login</Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto text-red-500" size={48} />
              <p className="text-red-600 font-medium">{message}</p>
              <Link to="/register" className="text-blue-600 hover:underline">Try registering again</Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
