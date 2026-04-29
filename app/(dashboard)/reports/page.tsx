'use client';
import { useEffect, useState } from 'react';
import { reportApi, periodApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileBarChart, TrendingUp, Users, DollarSign, Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { fmt } from '@/lib/utils';

const PIE_COLORS = ['hsl(230 76% 15%)', '#10b981', '#f59e0b', '#6366f1'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    periodApi.getAll().then(r => {
      const p = r.data?.Data || [];
      setPeriods(p);
      if (p.length > 0) setSelectedPeriod(String(p[0].Period_ID));
    }).catch(() => {});
  }, []);

  const loadReport = async (tab?: string, period?: string) => {
    const t = tab || activeTab;
    const p = period || selectedPeriod;
    if (!p) return toast.error('Select a period first');
    setLoading(true); setReport(null);
    try {
      let res;
      if (t === 'summary') res = await reportApi.payrollSummary(parseInt(p));
      else if (t === 'epf') res = await reportApi.epfReport(parseInt(p));
      else if (t === 'paye') res = await reportApi.payeReport(parseInt(p));
      else if (t === 'bank') res = await reportApi.bankTransfer(parseInt(p));
      setReport(res?.data?.Data || res?.data);
    } catch (e: any) { toast.error(e?.response?.data?.Message || 'Failed to generate report'); }
    setLoading(false);
  };

  useEffect(() => { if (selectedPeriod) loadReport(activeTab, selectedPeriod); }, [activeTab, selectedPeriod]);

  const exportCSV = (data: any[], filename: string) => {
    if (!data?.length) return toast.error('No data to export');
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${filename}.csv`; a.click();
    toast.success('CSV exported');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1 text-sm">Payroll analytics, EPF, PAYE & bank transfer reports</p>
        </div>
      </div>

      {/* Period selector */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="normal-case text-sm font-semibold text-slate-700 whitespace-nowrap">Payroll Period</Label>
            <Select value={selectedPeriod} onValueChange={v => setSelectedPeriod(v)}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Select a period..." /></SelectTrigger>
              <SelectContent>
                {periods.map(p => (
                  <SelectItem key={p.Period_ID} value={String(p.Period_ID)}>
                    {p.Period_Name} — <span className="text-slate-400">{p.Status}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => loadReport()} variant="outline">Refresh</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">Payroll Summary</TabsTrigger>
          <TabsTrigger value="epf">EPF Report</TabsTrigger>
          <TabsTrigger value="paye">PAYE Report</TabsTrigger>
          <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
        </TabsList>

        {loading && (
          <div className="py-20 text-center text-slate-400 text-sm">Generating report...</div>
        )}

        {/* Summary */}
        {!loading && activeTab === 'summary' && report && (
          <TabsContent value="summary" className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Employees', value: report.TotalEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Total Gross', value: fmt(report.TotalGrossSalary), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Total Deductions', value: fmt(report.TotalDeductions), icon: DollarSign, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Net Payroll', value: fmt(report.TotalNetSalary), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, i) => (
                <Card key={i} className="border-slate-200 shadow-none">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{s.label}</p>
                        <p className="text-lg font-bold text-slate-900">{s.value}</p>
                      </div>
                      <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Card className="border-slate-200 shadow-none">
                <CardHeader><CardTitle className="text-sm">EPF & ETF Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[
                    ['EPF Employee (8%)', fmt(report.TotalEPF_Employee), 'text-red-500'],
                    ['EPF Employer (12%)', fmt(report.TotalEPF_Employer), 'text-indigo-600'],
                    ['ETF (3%)', fmt(report.TotalETF), 'text-amber-600'],
                    ['Total EPF Payable', fmt(report.TotalEPF_Employee + report.TotalEPF_Employer), 'text-slate-900'],
                  ].map(([k, v, c]) => (
                    <div key={k as string} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0 text-sm">
                      <span className="text-slate-500">{k}</span>
                      <span className={`font-bold ${c}`}>{v}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardHeader><CardTitle className="text-sm">Salary Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[
                        { name: 'Net Salary', value: Math.round(report.TotalNetSalary) },
                        { name: 'EPF Employee', value: Math.round(report.TotalEPF_Employee) },
                        { name: 'Other Deductions', value: Math.max(0, Math.round(report.TotalDeductions - report.TotalEPF_Employee)) },
                      ]} dataKey="value" cx="50%" cy="50%" outerRadius={65} label={false}>
                        {[0, 1, 2].map(i => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `LKR ${Number(v).toLocaleString()}`} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Employee Payroll Details</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(report.Payrolls || [], 'payroll-summary')}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
              </CardHeader>
              <Separator />
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Basic</TableHead><TableHead>Gross</TableHead><TableHead>EPF Emp</TableHead><TableHead>EPF Empl</TableHead><TableHead>ETF</TableHead><TableHead>PAYE</TableHead><TableHead>Net Salary</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(report.Payrolls || []).map((p: any) => (
                    <TableRow key={p.PayrollID}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7 rounded-lg"><AvatarFallback className="rounded-lg text-[10px]">{p.EmployeeName?.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <div><p className="text-xs font-semibold">{p.EmployeeName}</p><p className="text-[10px] text-slate-400">{p.EPF_No}</p></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{fmt(p.BasicSalary)}</TableCell>
                      <TableCell className="text-xs">{fmt(p.GrossSalary)}</TableCell>
                      <TableCell className="text-xs text-red-500">{fmt(p.EPF_Employee)}</TableCell>
                      <TableCell className="text-xs text-indigo-600">{fmt(p.EPF_Employer)}</TableCell>
                      <TableCell className="text-xs text-amber-600">{fmt(p.ETF)}</TableCell>
                      <TableCell className="text-xs text-red-500">{fmt(p.PAYE_Tax)}</TableCell>
                      <TableCell className="text-sm font-bold text-slate-900">{fmt(p.NetSalary)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}

        {/* EPF */}
        {!loading && activeTab === 'epf' && report && (
          <TabsContent value="epf" className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'EPF Employee (8%)', value: fmt(report.TotalEPF_Employee), color: 'text-red-500' },
                { label: 'EPF Employer (12%)', value: fmt(report.TotalEPF_Employer), color: 'text-indigo-600' },
                { label: 'Total ETF (3%)', value: fmt(report.TotalETF), color: 'text-amber-600' },
              ].map((s, i) => (
                <Card key={i} className="border-slate-200 shadow-none">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">EPF Contribution Details</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(report.Records || [], 'epf-report')}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
              </CardHeader>
              <Separator />
              <Table>
                <TableHeader><TableRow><TableHead>EPF No</TableHead><TableHead>Name</TableHead><TableHead>Basic Salary</TableHead><TableHead>EPF Employee (8%)</TableHead><TableHead>EPF Employer (12%)</TableHead><TableHead>ETF (3%)</TableHead><TableHead>Total EPF</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(report.Records || []).map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{r.EPF_No}</span></TableCell>
                      <TableCell className="text-sm font-semibold">{r.FullName}</TableCell>
                      <TableCell className="text-sm">{fmt(r.BasicSalary)}</TableCell>
                      <TableCell className="text-sm font-semibold text-red-500">{fmt(r.EPF_Employee_8)}</TableCell>
                      <TableCell className="text-sm font-semibold text-indigo-600">{fmt(r.EPF_Employer_12)}</TableCell>
                      <TableCell className="text-sm font-semibold text-amber-600">{fmt(r.ETF_3)}</TableCell>
                      <TableCell className="text-sm font-bold text-slate-900">{fmt(r.Total_EPF)}</TableCell>
                    </TableRow>
                  ))}
                  {(!report.Records?.length) && <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">No EPF records</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}

        {/* PAYE */}
        {!loading && activeTab === 'paye' && report && (
          <TabsContent value="paye" className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-slate-200 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Total PAYE Tax</p><p className="text-xl font-bold text-red-500">{fmt(report.TotalPAYE)}</p></CardContent></Card>
              <Card className="border-slate-200 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Total SSL (2.5%)</p><p className="text-xl font-bold text-amber-600">{fmt(report.TotalSSL)}</p></CardContent></Card>
            </div>
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">PAYE Tax Details</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(report.Records || [], 'paye-report')}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
              </CardHeader>
              <Separator />
              <Table>
                <TableHeader><TableRow><TableHead>EPF No</TableHead><TableHead>Name</TableHead><TableHead>Gross Salary</TableHead><TableHead>PAYE Tax</TableHead><TableHead>SSL Tax</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(report.Records || []).map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{r.EPF_No}</span></TableCell>
                      <TableCell className="text-sm font-semibold">{r.FullName}</TableCell>
                      <TableCell className="text-sm">{fmt(r.GrossSalary)}</TableCell>
                      <TableCell className="text-sm font-bold text-red-500">{fmt(r.PAYE_Tax)}</TableCell>
                      <TableCell className="text-sm font-semibold text-amber-600">{fmt(r.SSL_Tax)}</TableCell>
                    </TableRow>
                  ))}
                  {(!report.Records?.length) && <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">No PAYE tax records for this period</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}

        {/* Bank Transfer */}
        {!loading && activeTab === 'bank' && report && (
          <TabsContent value="bank" className="space-y-5">
            <Card className="border-slate-200 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Total Net Salary to Transfer</p>
                <p className="text-3xl font-bold text-emerald-600">{fmt(report.TotalNetSalary)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Bank Transfer List</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(report.Records || [], 'bank-transfer')}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
              </CardHeader>
              <Separator />
              <Table>
                <TableHeader><TableRow><TableHead>EPF No</TableHead><TableHead>Name</TableHead><TableHead>Bank</TableHead><TableHead>Branch</TableHead><TableHead>Account No</TableHead><TableHead>Net Salary</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(report.Records || []).map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{r.EPF_No}</span></TableCell>
                      <TableCell className="text-sm font-semibold">{r.FullName}</TableCell>
                      <TableCell className="text-sm text-slate-600">{r.BankName || '—'}</TableCell>
                      <TableCell className="text-xs text-slate-500">{r.BranchName || '—'} {r.BranchCode ? `(${r.BranchCode})` : ''}</TableCell>
                      <TableCell><span className="font-mono text-xs">{r.BankAccountNo || '—'}</span></TableCell>
                      <TableCell className="text-sm font-bold text-emerald-600">{fmt(r.NetSalary)}</TableCell>
                    </TableRow>
                  ))}
                  {(!report.Records?.length) && <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No records found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}

        {!loading && !report && (
          <div className="py-24 text-center">
            <FileBarChart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">Select a period to generate reports</p>
          </div>
        )}
      </Tabs>
    </div>
  );
}
