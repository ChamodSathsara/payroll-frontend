"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Building2,
  Lock,
  User,
  Shield,
  Users,
  DollarSign,
  BarChart3,
  FileText,
} from "lucide-react";

export default function LoginPage() {
  const [form, setForm] = useState({ UserName: "", Password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const data = res.data?.Data || res.data;
      if (data?.Success || data?.success) {
        login(data);
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        toast.error(data?.Message || "Login failed");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.Message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap");

        .login-page {
          font-family: "Inter", sans-serif;
        }

        .brand-font {
          font-family: "Outfit", sans-serif;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out forwards;
        }

        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out forwards;
        }

        .input-glow:focus-within {
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
      `}</style>

      <div className="login-page h-screen w-screen flex overflow-hidden">
        {/* LEFT SIDE - Payroll Themed Visual */}
        <div
          className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden"
          style={{ background: "hsl(var(--sidebar))" }}
        >
          {/* Decorative rings - matching original design */}
          <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full border border-amber-500/10 pointer-events-none" />
          <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full border border-amber-500/5 pointer-events-none" />
          <div className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />

          {/* Grid texture - matching original */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Content Container with proper spacing */}
          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full h-full">
            {/* Logo & Brand */}
            {/* <div className="animate-slideInLeft">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg">
                  <Building2 className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h1 className="brand-font text-3xl font-semibold text-white">
                    PayrollPro
                  </h1>
                  <p className="text-white/60 text-sm">Sri Lanka Edition</p>
                </div>
              </div>
            </div> */}

            {/* Main Content - Centered */}
            <div
              className="flex-1 flex flex-col justify-center max-w-xl animate-slideInLeft"
              style={{ animationDelay: "0.2s" }}
            >
              <h2 className="brand-font text-5xl xl:text-6xl font-bold leading-tight mb-6 text-white">
                Streamline Your
                <br />
                <span className="text-amber-400">Payroll Operations</span>
              </h2>
              <p className="text-lg text-white/70 mb-10 leading-relaxed">
                Complete HR and payroll management solution designed for Sri
                Lankan businesses. Manage salaries, EPF/ETF, and compliance with
                ease.
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-white">
                    Employee Management
                  </h3>
                  <p className="text-sm text-white/60">
                    Comprehensive records & profiles
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-white">
                    Salary Processing
                  </h3>
                  <p className="text-sm text-white/60">
                    Automated calculations in LKR
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-white">
                    Reports & Analytics
                  </h3>
                  <p className="text-sm text-white/60">
                    Real-time insights & reports
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-white">
                    EPF/ETF Compliance
                  </h3>
                  <p className="text-sm text-white/60">
                    Automatic statutory compliance
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            {/* <div
              className="text-white/40 text-sm animate-slideInLeft"
              style={{ animationDelay: "0.4s" }}
            >
              <p>Trusted by 500+ companies across Sri Lanka</p>
            </div> */}
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 bg-white flex items-center justify-center p-8 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md animate-slideInRight">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h1 className="brand-font text-2xl font-semibold text-slate-800">
                  PayrollPro
                </h1>
                <p className="text-slate-500 text-sm">
                  HR & Payroll Management
                </p>
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-8">
              <h2 className="brand-font text-3xl font-bold text-slate-800 mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-500">Sign in to access your dashboard</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-slate-700"
                >
                  Username
                </Label>
                <div className="relative input-glow transition-shadow rounded-lg">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                    strokeWidth={2}
                  />
                  <Input
                    id="username"
                    className="pl-12 h-12 border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 transition-all text-base rounded-lg"
                    placeholder="Enter your username"
                    value={form.UserName}
                    onChange={(e) =>
                      setForm({ ...form, UserName: e.target.value })
                    }
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </Label>
                <div className="relative input-glow transition-shadow rounded-lg">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                    strokeWidth={2}
                  />
                  <Input
                    id="password"
                    className="pl-12 pr-12 h-12 border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 transition-all text-base rounded-lg"
                    type={showPw ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.Password}
                    onChange={(e) =>
                      setForm({ ...form, Password: e.target.value })
                    }
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPw ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200 mt-6 rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Security Info */}
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Secure Connection
                  </p>
                  <p className="text-xs text-slate-500">
                    🔒 Sri Lanka Payroll System (LKR)
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                © 2024 PayrollPro. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
