'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { employeeApi, payrollApi, periodApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Users, DollarSign, Calendar, TrendingUp, ArrowUpRight, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { fmt, fmtShort } from '@/lib/utils';

const statusVariant: Record<string, any> = {
  PAID: 'success', APPROVED: 'info', CALCULATED: 'warning', CANCELLED: 'destructive',
  DRAFT: 'slate', PROCESSING: 'warning', LOCKED: 'default',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ employees: 0, periods: 0, payrolls: [] as any[], totalNet: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, periodRes] = await Promise.allSettled([employeeApi.getAll(), periodApi.getAll()]);
        const emps = empRes.status === 'fulfilled' ? empRes.value.data?.Data || [] : [];
        const periods = periodRes.status === 'fulfilled' ? periodRes.value.data?.Data || [] : [];
        let payrolls: any[] = [];
        if (periods.length > 0) {
          const pRes = await payrollApi.getAll(periods[0].Period_ID).catch(() => null);
          payrolls = pRes?.data?.Data || [];
        }
        setStats({ employees: emps.filter((e: any) => e.Status === 1).length, periods: periods.length, payrolls, totalNet: payrolls.reduce((s: number, p: any) => s + (p.NetSalary || 0), 0) });
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const chartData = stats.payrolls.slice(0, 8).map((p: any) => ({
    name: p.EmployeeName?.split(' ')[0] || 'Emp', gross: p.GrossSalary, net: p.NetSalary,
  }));

  const statCards = [
    { label: 'Active Employees', value: loading ? '—' : stats.employees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Net Payroll', value: loading ? '—' : fmtShort(stats.totalNet), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Payroll Periods', value: loading ? '—' : stats.periods, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'Latest Payrolls', value: loading ? '—' : stats.payrolls.length, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  ];

  const quickLinks = [
    { href: '/employees', label: 'Add Employee', sub: 'Register new staff member', icon: Users },
    { href: '/payroll', label: 'Run Payroll', sub: 'Generate for a period', icon: Calendar },
    { href: '/salary-slips', label: 'Salary Slips', sub: 'Generate & download PDFs', icon: BarChart3 },
    { href: '/reports', label: 'View Reports', sub: 'EPF, PAYE, bank list', icon: TrendingUp },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-slate-900">
          Good day, {user?.UserName} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Here's your payroll system overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="border-slate-200 shadow-none hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.border} border flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Chart */}
        <Card className="col-span-2 border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle>Salary Distribution</CardTitle>
            <CardDescription>Gross vs Net for the latest payroll period</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(v: any) => [`LKR ${Number(v).toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'Plus Jakarta Sans' }}
                  />
                  <Bar dataKey="gross" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Gross" />
                  <Bar dataKey="net" fill="hsl(230 76% 15%)" radius={[4, 4, 0, 0]} name="Net" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                No payroll data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.map((ql, i) => (
              <Link key={i} href={ql.href}>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <ql.icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{ql.label}</p>
                      <p className="text-xs text-slate-500">{ql.sub}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent payroll table */}
      {stats.payrolls.length > 0 && (
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle>Latest Payroll Records</CardTitle>
              <CardDescription className="mt-0.5">Most recent payroll period</CardDescription>
            </div>
            <Link href="/payroll">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <Separator />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.payrolls.slice(0, 6).map((p: any) => (
                <TableRow key={p.PayrollID}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-[10px]">
                          {p.EmployeeName?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.EmployeeName}</p>
                        <p className="text-xs text-slate-400">{p.EPF_No}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{fmt(p.BasicSalary)}</TableCell>
                  <TableCell className="text-sm text-slate-600">{fmt(p.GrossSalary)}</TableCell>
                  <TableCell className="text-sm text-red-500 font-medium">-{fmt(p.Deduction_Total)}</TableCell>
                  <TableCell className="text-sm font-bold text-slate-900">{fmt(p.NetSalary)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.Status] || 'slate'}>{p.Status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
