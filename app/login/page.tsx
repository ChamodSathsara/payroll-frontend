'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Building2, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ UserName: '', Password: '' });
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
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        toast.error(data?.Message || 'Login failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.Message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'hsl(var(--sidebar))' }}
    >
      {/* Decorative rings */}
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full border border-amber-500/10 pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full border border-amber-500/5 pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">PayrollPro</h1>
          <p className="text-white/40 text-sm mt-1">HR & Payroll Management</p>
        </div>

        <Card className="border-white/10 shadow-2xl" style={{ background: 'rgba(255,255,255,0.97)' }}>
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl">Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="username"
                    className="pl-9"
                    placeholder="Enter your username"
                    value={form.UserName}
                    onChange={e => setForm({ ...form, UserName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    className="pl-9 pr-10"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.Password}
                    onChange={e => setForm({ ...form, Password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 text-base" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 text-center">
                🔒 Secured • Sri Lanka Payroll System (LKR)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
