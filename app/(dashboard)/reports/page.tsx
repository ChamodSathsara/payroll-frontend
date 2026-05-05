"use client";
import { useEffect, useState, useCallback } from "react";
import { reportApi, periodApi, departmentApi, downloadFile } from "@/lib/api";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Download,
  FileBarChart,
  TrendingUp,
  Users,
  DollarSign,
  Building,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { fmt } from "@/lib/utils";

const PIE_COLORS = ["hsl(230 76% 15%)", "#10b981", "#f59e0b", "#6366f1"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ─── Shared filter state ────────────────────────────────────────────────────
interface Filters {
  periodId: string;
  companyId: string;
  departmentId: string;
  year: string;
  employeeId: string;
}

// ─── Download button with loading state ─────────────────────────────────────
function DownloadBtn({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: any;
  onClick: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await onClick();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handle}
      disabled={busy}
      className="gap-1.5"
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      {label}
    </Button>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color = "text-slate-900",
  bg = "bg-slate-50",
  icon: Icon,
}: any) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {label}
            </p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
          {Icon && (
            <div
              className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({
  message = "No data for selected filters",
}: {
  message?: string;
}) {
  return (
    <div className="py-16 text-center">
      <FileBarChart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

// ─── Loading ─────────────────────────────────────────────────────────────────
function Loading() {
  return (
    <div className="py-20 flex items-center justify-center gap-2 text-slate-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Generating report...
    </div>
  );
}

// ─── Export CSV helper ───────────────────────────────────────────────────────
function exportCSV(data: any[], filename: string) {
  if (!data?.length) return toast.error("No data to export");
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map((row) => keys.map((k) => `"${row[k] ?? ""}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  downloadFile(blob, `${filename}.csv`);
  toast.success("CSV exported");
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("payroll-summary");
  const [periods, setPeriods] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>({
    periodId: "",
    companyId: "1", // default; adjust if you have a company selector
    departmentId: "",
    year: String(new Date().getFullYear()),
    employeeId: "",
  });
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load periods + departments once
  useEffect(() => {
    periodApi
      .getAll()
      .then((r) => {
        const p = r.data?.Data || [];
        setPeriods(p);
        if (p.length > 0)
          setFilters((f) => ({ ...f, periodId: String(p[0].Period_ID) }));
      })
      .catch(() => {});
    departmentApi
      .getAll()
      .then((r) => {
        setDepartments(r.data?.Data || []);
      })
      .catch(() => {});
  }, []);

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const loadReport = useCallback(
    async (tab?: string, f?: Filters) => {
      const t = tab || activeTab;
      const fi = f || filters;
      const pid = parseInt(fi.periodId);
      const cid = parseInt(fi.companyId);
      const did = fi.departmentId ? parseInt(fi.departmentId) : undefined;
      const yr = parseInt(fi.year);

      setLoading(true);
      setReport(null);
      try {
        let res: any;
        switch (t) {
          // Legacy
          case "payroll-summary":
            if (!fi.periodId) {
              toast.error("Select a period");
              break;
            }
            res = await reportApi.payrollSummary(pid);
            break;
          case "epf-legacy":
            if (!fi.periodId) {
              toast.error("Select a period");
              break;
            }
            res = await reportApi.epfReport(pid);
            break;
          case "paye-legacy":
            if (!fi.periodId) {
              toast.error("Select a period");
              break;
            }
            res = await reportApi.payeReport(pid);
            break;
          case "bank":
            if (!fi.periodId) {
              toast.error("Select a period");
              break;
            }
            res = await reportApi.bankTransfer(pid);
            break;

          // New reports
          case "dept-wise-salary":
            if (!fi.periodId || !fi.companyId) {
              toast.error("Select period & company");
              break;
            }
            res = await reportApi.departmentWiseSalary(cid, pid, did);
            break;
          case "dept-salary-summary":
            if (!fi.periodId || !fi.companyId) {
              toast.error("Select period & company");
              break;
            }
            res = await reportApi.departmentSalarySummary(cid, pid);
            break;
          case "epf-contributions":
            if (!fi.periodId || !fi.companyId) {
              toast.error("Select period & company");
              break;
            }
            res = await reportApi.epfContributions(cid, pid, did);
            break;
          case "etf-contributions":
            if (!fi.periodId || !fi.companyId) {
              toast.error("Select period & company");
              break;
            }
            res = await reportApi.etfContributions(cid, pid, did);
            break;
          case "msps-contributions":
            if (!fi.periodId || !fi.companyId) {
              toast.error("Select period & company");
              break;
            }
            res = await reportApi.mspsContributions(cid, pid, did);
            break;
          case "monthly-dept-cost":
            if (!fi.companyId || !fi.year) {
              toast.error("Select company & year");
              break;
            }
            res = await reportApi.monthlyDepartmentCost(cid, yr);
            break;
          case "paye-tax":
            if (!fi.periodId || !fi.companyId) {
              toast.error("Select period & company");
              break;
            }
            res = await reportApi.payeTax(cid, pid);
            break;
          case "payroll-full-detailed":
            if (!fi.periodId || !fi.companyId) {
              toast.error("Select period & company");
              break;
            }
            res = await reportApi.payrollFullDetailed(cid, pid, did);
            break;
          case "payroll-summary-report":
            if (!fi.periodId) {
              toast.error("Select a period");
              break;
            }
            res = await reportApi.payrollSummaryReport(
              pid,
              fi.companyId ? cid : undefined,
            );
            break;
          case "employee-history":
            if (!fi.employeeId) {
              toast.error("Enter an employee ID");
              break;
            }
            res = await reportApi.employeeHistory(parseInt(fi.employeeId));
            break;
          default:
            break;
        }
        setReport(res?.data?.Data ?? res?.data ?? null);
      } catch (e: any) {
        toast.error(e?.response?.data?.Message || "Failed to generate report");
      }
      setLoading(false);
    },
    [activeTab, filters],
  );

  // Auto-load on tab / period change
  useEffect(() => {
    if (
      filters.periodId ||
      activeTab === "monthly-dept-cost" ||
      activeTab === "employee-history"
    ) {
      loadReport(activeTab, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    filters.periodId,
    filters.companyId,
    filters.departmentId,
    filters.year,
  ]);

  // Download helpers
  const dlExcel = async (fn: () => Promise<any>, name: string) => {
    const res = await fn();
    downloadFile(
      new Blob([res.data], { type: res.headers["content-type"] }),
      `${name}.xlsx`,
    );
    toast.success("Excel downloaded");
  };
  const dlPdf = async (fn: () => Promise<any>, name: string) => {
    const res = await fn();
    downloadFile(
      new Blob([res.data], { type: "application/pdf" }),
      `${name}.pdf`,
    );
    toast.success("PDF downloaded");
  };

  const pid = parseInt(filters.periodId);
  const cid = parseInt(filters.companyId);
  const did = filters.departmentId ? parseInt(filters.departmentId) : undefined;
  const yr = parseInt(filters.year);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-slate-900">
          Reports
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Payroll, statutory & analytical reports
        </p>
      </div>

      {/* Global Filters */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Period */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">
                Period
              </Label>
              <Select
                value={filters.periodId}
                onValueChange={(v) => setFilter("periodId", v)}
              >
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Select period..." />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.Period_ID} value={String(p.Period_ID)}>
                      {p.Period_Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company ID */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">
                Company ID
              </Label>
              <Input
                type="number"
                className="w-28"
                value={filters.companyId}
                onChange={(e) => setFilter("companyId", e.target.value)}
                placeholder="e.g. 1"
              />
            </div>

            {/* Department */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">
                Department (optional)
              </Label>
              <Select
                value={filters.departmentId || "__all__"}
                onValueChange={(v) =>
                  setFilter("departmentId", v === "__all__" ? "" : v)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Departments</SelectItem>
                  {departments.map((d: any) => (
                    <SelectItem
                      key={d.Department_ID}
                      value={String(d.Department_ID)}
                    >
                      {d.Department_Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year (for monthly cost) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">
                Year
              </Label>
              <Input
                type="number"
                className="w-24"
                value={filters.year}
                onChange={(e) => setFilter("year", e.target.value)}
              />
            </div>

            {/* Employee ID (for history) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">
                Employee ID
              </Label>
              <Input
                type="number"
                className="w-32"
                value={filters.employeeId}
                onChange={(e) => setFilter("employeeId", e.target.value)}
                placeholder="For history"
              />
            </div>

            <Button
              onClick={() => loadReport()}
              variant="outline"
              className="self-end"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="payroll-summary">Payroll Summary</TabsTrigger>
          <TabsTrigger value="payroll-summary-report">
            Summary Report
          </TabsTrigger>
          <TabsTrigger value="dept-wise-salary">Dept Wise Salary</TabsTrigger>
          <TabsTrigger value="dept-salary-summary">Dept Summary</TabsTrigger>
          <TabsTrigger value="epf-contributions">EPF</TabsTrigger>
          <TabsTrigger value="etf-contributions">ETF</TabsTrigger>
          <TabsTrigger value="msps-contributions">MSPS</TabsTrigger>
          <TabsTrigger value="paye-tax">PAYE Tax</TabsTrigger>
          <TabsTrigger value="monthly-dept-cost">Monthly Cost</TabsTrigger>
          <TabsTrigger value="payroll-full-detailed">Full Detailed</TabsTrigger>

          
        </TabsList>

        {loading && <Loading />}

        {/* ══ 1. PAYROLL SUMMARY (legacy) ══════════════════════════════════ */}
        {!loading && activeTab === "payroll-summary" && (
          <TabsContent value="payroll-summary" className="space-y-5 mt-4">
            {!report ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <StatCard
                    label="Employees"
                    value={report.TotalEmployees}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                  />
                  <StatCard
                    label="Total Gross"
                    value={fmt(report.TotalGrossSalary)}
                    icon={TrendingUp}
                    color="text-purple-600"
                    bg="bg-purple-50"
                  />
                  <StatCard
                    label="Total Deductions"
                    value={fmt(report.TotalDeductions)}
                    icon={DollarSign}
                    color="text-red-500"
                    bg="bg-red-50"
                  />
                  <StatCard
                    label="Net Payroll"
                    value={fmt(report.TotalNetSalary)}
                    icon={DollarSign}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <Card className="border-slate-200 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        EPF & ETF Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        [
                          "EPF Employee (8%)",
                          fmt(report.TotalEPF_Employee),
                          "text-red-500",
                        ],
                        [
                          "EPF Employer (12%)",
                          fmt(report.TotalEPF_Employer),
                          "text-indigo-600",
                        ],
                        ["ETF (3%)", fmt(report.TotalETF), "text-amber-600"],
                        [
                          "Total EPF Payable",
                          fmt(
                            (report.TotalEPF_Employee ?? 0) +
                              (report.TotalEPF_Employer ?? 0),
                          ),
                          "text-slate-900",
                        ],
                      ].map(([k, v, c]) => (
                        <div
                          key={k as string}
                          className="flex justify-between py-2.5 border-b border-slate-100 last:border-0 text-sm"
                        >
                          <span className="text-slate-500">{k}</span>
                          <span className={`font-bold ${c}`}>{v}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Salary Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Net Salary",
                                value: Math.round(report.TotalNetSalary ?? 0),
                              },
                              {
                                name: "EPF Employee",
                                value: Math.round(
                                  report.TotalEPF_Employee ?? 0,
                                ),
                              },
                              {
                                name: "Other Deductions",
                                value: Math.max(
                                  0,
                                  Math.round(
                                    (report.TotalDeductions ?? 0) -
                                      (report.TotalEPF_Employee ?? 0),
                                  ),
                                ),
                              },
                            ]}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            outerRadius={65}
                            label={false}
                          >
                            {[0, 1, 2].map((i) => (
                              <Cell key={i} fill={PIE_COLORS[i]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: any) =>
                              `LKR ${Number(v).toLocaleString()}`
                            }
                            contentStyle={{
                              fontSize: "12px",
                              borderRadius: "8px",
                            }}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: "12px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">
                      Employee Payroll Details
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportCSV(report.Payrolls || [], "payroll-summary")
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                    </Button>
                  </CardHeader>
                  <Separator />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Basic</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>EPF Emp</TableHead>
                        <TableHead>EPF Empl</TableHead>
                        <TableHead>ETF</TableHead>
                        <TableHead>PAYE</TableHead>
                        <TableHead>Net Salary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.Payrolls || []).map((p: any) => (
                        <TableRow key={p.PayrollID}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7 rounded-lg">
                                <AvatarFallback className="rounded-lg text-[10px]">
                                  {p.EmployeeName?.substring(
                                    0,
                                    2,
                                  ).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-semibold">
                                  {p.EmployeeName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {p.EPF_No}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(p.BasicSalary)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(p.GrossSalary)}
                          </TableCell>
                          <TableCell className="text-xs text-red-500">
                            {fmt(p.EPF_Employee)}
                          </TableCell>
                          <TableCell className="text-xs text-indigo-600">
                            {fmt(p.EPF_Employer)}
                          </TableCell>
                          <TableCell className="text-xs text-amber-600">
                            {fmt(p.ETF)}
                          </TableCell>
                          <TableCell className="text-xs text-red-500">
                            {fmt(p.PAYE_Tax)}
                          </TableCell>
                          <TableCell className="text-sm font-bold">
                            {fmt(p.NetSalary)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!report.Payrolls?.length && (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-10 text-slate-400"
                          >
                            No records
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* ══ 2. PAYROLL SUMMARY REPORT (report 7) ════════════════════════ */}
        {!loading && activeTab === "payroll-summary-report" && (
          <TabsContent
            value="payroll-summary-report"
            className="space-y-5 mt-4"
          >
            <div className="flex justify-end gap-2">
              <DownloadBtn
                label="Excel"
                icon={FileSpreadsheet}
                onClick={() =>
                  dlExcel(
                    () => reportApi.payrollSummaryReportExcel(pid, cid),
                    "PayrollSummaryReport",
                  )
                }
              />
              <DownloadBtn
                label="PDF"
                icon={FileText}
                onClick={() =>
                  dlPdf(
                    () => reportApi.payrollSummaryReportPdf(pid, cid),
                    "PayrollSummaryReport",
                  )
                }
              />
            </div>
            {!report ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <StatCard
                    label="Total Employees"
                    value={report.TotalEmployees}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                  />
                  <StatCard
                    label="Total Basic"
                    value={fmt(report.TotalBasicSalary)}
                    icon={DollarSign}
                    color="text-slate-700"
                    bg="bg-slate-50"
                  />
                  <StatCard
                    label="Total Gross"
                    value={fmt(report.TotalGrossSalary)}
                    icon={TrendingUp}
                    color="text-purple-600"
                    bg="bg-purple-50"
                  />
                  <StatCard
                    label="Total Net"
                    value={fmt(report.TotalNetSalary)}
                    icon={DollarSign}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                  />
                </div>
                <Card className="border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Company Breakdown
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Basic</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>EPF Employer</TableHead>
                        <TableHead>ETF</TableHead>
                        <TableHead>MSPS Employer</TableHead>
                        <TableHead>PAYE Tax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.CompanySummaries || []).map(
                        (r: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold text-sm">
                              {r.CompanyName}
                            </TableCell>
                            <TableCell>{r.TotalEmployees}</TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.TotalBasicSalary)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.TotalGrossSalary)}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-emerald-600">
                              {fmt(r.TotalNetSalary)}
                            </TableCell>
                            <TableCell className="text-xs text-indigo-600">
                              {fmt(r.TotalEPF_Employer)}
                            </TableCell>
                            <TableCell className="text-xs text-amber-600">
                              {fmt(r.TotalETF)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.TotalMSPS_Employer)}
                            </TableCell>
                            <TableCell className="text-xs text-red-500">
                              {fmt(r.TotalPAYE_Tax)}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* ══ 3. DEPARTMENT WISE SALARY ════════════════════════════════════ */}
        {!loading && activeTab === "dept-wise-salary" && (
          <TabsContent value="dept-wise-salary" className="space-y-5 mt-4">
            <div className="flex justify-end gap-2">
              <DownloadBtn
                label="Excel"
                icon={FileSpreadsheet}
                onClick={() =>
                  dlExcel(
                    () => reportApi.departmentWiseSalaryExcel(cid, pid, did),
                    "DeptWiseSalary",
                  )
                }
              />
              <DownloadBtn
                label="PDF"
                icon={FileText}
                onClick={() =>
                  dlPdf(
                    () => reportApi.departmentWiseSalaryPdf(cid, pid, did),
                    "DeptWiseSalary",
                  )
                }
              />
            </div>
            {!report?.Records?.length ? (
              <EmptyState />
            ) : (
              <Card className="border-slate-200 shadow-none">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-base">
                    Department Wise Salary Details
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      exportCSV(report.Records, "dept-wise-salary")
                    }
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> CSV
                  </Button>
                </CardHeader>
                <Separator />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>EPF No</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Basic</TableHead>
                        <TableHead>Fixed Allow.</TableHead>
                        <TableHead>Variable Allow.</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>EPF Emp</TableHead>
                        <TableHead>EPF Empl</TableHead>
                        <TableHead>ETF</TableHead>
                        <TableHead>MSPS Emp</TableHead>
                        <TableHead>MSPS Empl</TableHead>
                        <TableHead>PAYE</TableHead>
                        <TableHead>Net Salary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.Records.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium">
                            {r.DepartmentName}
                          </TableCell>
                          <TableCell className="text-xs font-semibold whitespace-nowrap">
                            {r.EmployeeName}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {r.EPF_No}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.Designation}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.BasicSalary)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.Fixed_Allowance_Total)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.Variable_Allowance_Total)}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {fmt(r.GrossSalary)}
                          </TableCell>
                          <TableCell className="text-xs text-red-500">
                            {fmt(r.Deduction_Total)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.EPF_Employee)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.EPF_Employer)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.ETF)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.MSPS_Employee)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.MSPS_Employer)}
                          </TableCell>
                          <TableCell className="text-xs text-red-500">
                            {fmt(r.PAYE_Tax)}
                          </TableCell>
                          <TableCell className="text-sm font-bold text-emerald-600">
                            {fmt(r.NetSalary)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>
        )}

        {/* ══ 4. DEPARTMENT SALARY SUMMARY ════════════════════════════════ */}
        {!loading && activeTab === "dept-salary-summary" && (
          <TabsContent value="dept-salary-summary" className="space-y-5 mt-4">
            <div className="flex justify-end gap-2">
              <DownloadBtn
                label="Excel"
                icon={FileSpreadsheet}
                onClick={() =>
                  dlExcel(
                    () => reportApi.departmentSalarySummaryExcel(cid, pid),
                    "DeptSalarySummary",
                  )
                }
              />
              <DownloadBtn
                label="PDF"
                icon={FileText}
                onClick={() =>
                  dlPdf(
                    () => reportApi.departmentSalarySummaryPdf(cid, pid),
                    "DeptSalarySummary",
                  )
                }
              />
            </div>
            {!report?.Records?.length ? (
              <EmptyState />
            ) : (
              <>
                {/* Bar chart */}
                <Card className="border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Net Salary by Department
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={report.Records}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="DepartmentName"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(v: any) =>
                            `LKR ${Number(v).toLocaleString()}`
                          }
                          contentStyle={{
                            fontSize: "12px",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="NetSalary"
                          name="Net Salary"
                          fill="hsl(230 76% 15%)"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="GrossSalary"
                          name="Gross"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">
                      Department Salary Summary
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportCSV(report.Records, "dept-salary-summary")
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> CSV
                    </Button>
                  </CardHeader>
                  <Separator />
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department</TableHead>
                          <TableHead>Basic</TableHead>
                          <TableHead>Fixed Allow.</TableHead>
                          <TableHead>Variable Allow.</TableHead>
                          <TableHead>Gross</TableHead>
                          <TableHead>Deductions</TableHead>
                          <TableHead>EPF Emp</TableHead>
                          <TableHead>EPF Empl</TableHead>
                          <TableHead>ETF</TableHead>
                          <TableHead>MSPS Emp</TableHead>
                          <TableHead>MSPS Empl</TableHead>
                          <TableHead>PAYE</TableHead>
                          <TableHead>Net Salary</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.Records.map((r: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold text-sm">
                              {r.DepartmentName}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.BasicSalary)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.Fixed_Allowance_Total)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.Variable_Allowance_Total)}
                            </TableCell>
                            <TableCell className="text-xs font-semibold">
                              {fmt(r.GrossSalary)}
                            </TableCell>
                            <TableCell className="text-xs text-red-500">
                              {fmt(r.Deduction_Total)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.EPF_Employee)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.EPF_Employer)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.ETF)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.MSPS_Employee)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmt(r.MSPS_Employer)}
                            </TableCell>
                            <TableCell className="text-xs text-red-500">
                              {fmt(r.PAYE_Tax)}
                            </TableCell>
                            <TableCell className="text-sm font-bold text-emerald-600">
                              {fmt(r.NetSalary)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* ══ 5. EPF CONTRIBUTIONS ════════════════════════════════════════ */}
        {!loading && activeTab === "epf-contributions" && (
          <TabsContent value="epf-contributions" className="space-y-5 mt-4">
            <div className="flex justify-end gap-2">
              <DownloadBtn
                label="Excel"
                icon={FileSpreadsheet}
                onClick={() =>
                  dlExcel(
                    () => reportApi.epfContributionsExcel(cid, pid, did),
                    "EPFContributions",
                  )
                }
              />
              <DownloadBtn
                label="PDF"
                icon={FileText}
                onClick={() =>
                  dlPdf(
                    () => reportApi.epfContributionsPdf(cid, pid, did),
                    "EPFContributions",
                  )
                }
              />
            </div>
            {!report ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <StatCard
                    label="EPF Employee (8%)"
                    value={fmt(report.TotalEPF_Employee)}
                    color="text-red-500"
                  />
                  <StatCard
                    label="EPF Employer (12%)"
                    value={fmt(report.TotalEPF_Employer)}
                    color="text-indigo-600"
                  />
                  <StatCard
                    label="Total EPF"
                    value={fmt(report.TotalEPF)}
                    color="text-slate-900"
                  />
                </div>
                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">
                      EPF Contribution Details
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportCSV(report.Records || [], "epf-contributions")
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> CSV
                    </Button>
                  </CardHeader>
                  <Separator />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>EPF No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Basic Salary</TableHead>
                        <TableHead>EPF Emp (8%)</TableHead>
                        <TableHead>EPF Employer (12%)</TableHead>
                        <TableHead>Total EPF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.Records || []).map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">
                            {r.CompanyName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.DepartmentName}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {r.EPF_No}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            {r.EmployeeName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.BasicSalary)}
                          </TableCell>
                          <TableCell className="text-xs text-red-500 font-semibold">
                            {fmt(r.EPF_Employee)}
                          </TableCell>
                          <TableCell className="text-xs text-indigo-600 font-semibold">
                            {fmt(r.EPF_Employer)}
                          </TableCell>
                          <TableCell className="text-sm font-bold">
                            {fmt(r.Total_EPF)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!report.Records?.length && (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-10 text-slate-400"
                          >
                            No EPF records
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* ══ 6. ETF CONTRIBUTIONS ════════════════════════════════════════ */}
        {!loading && activeTab === "etf-contributions" && (
          <TabsContent value="etf-contributions" className="space-y-5 mt-4">
            <div className="flex justify-end gap-2">
              <DownloadBtn
                label="Excel"
                icon={FileSpreadsheet}
                onClick={() =>
                  dlExcel(
                    () => reportApi.etfContributionsExcel(cid, pid, did),
                    "ETFContributions",
                  )
                }
              />
              <DownloadBtn
                label="PDF"
                icon={FileText}
                onClick={() =>
                  dlPdf(
                    () => reportApi.etfContributionsPdf(cid, pid, did),
                    "ETFContributions",
                  )
                }
              />
            </div>
            {!report ? (
              <EmptyState />
            ) : (
              <>
                <StatCard
                  label="Total ETF (3%)"
                  value={fmt(report.TotalETF)}
                  color="text-amber-600"
                />
                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">
                      ETF Contribution Details
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportCSV(report.Records || [], "etf-contributions")
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> CSV
                    </Button>
                  </CardHeader>
                  <Separator />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>EPF No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Basic Salary</TableHead>
                        <TableHead>ETF (3%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.Records || []).map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">
                            {r.CompanyName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.DepartmentName}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {r.EPF_No}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            {r.EmployeeName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.BasicSalary)}
                          </TableCell>
                          <TableCell className="text-sm font-bold text-amber-600">
                            {fmt(r.ETF)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!report.Records?.length && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-10 text-slate-400"
                          >
                            No ETF records
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* ══ 7. MSPS CONTRIBUTIONS ═══════════════════════════════════════ */}
        {!loading && activeTab === "msps-contributions" && (
          <TabsContent value="msps-contributions" className="space-y-5 mt-4">
            <div className="flex justify-end gap-2">
              <DownloadBtn
                label="Excel"
                icon={FileSpreadsheet}
                onClick={() =>
                  dlExcel(
                    () => reportApi.mspsContributionsExcel(cid, pid, did),
                    "MSPSContributions",
                  )
                }
              />
              <DownloadBtn
                label="PDF"
                icon={FileText}
                onClick={() =>
                  dlPdf(
                    () => reportApi.mspsContributionsPdf(cid, pid, did),
                    "MSPSContributions",
                  )
                }
              />
            </div>
            {!report ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <StatCard
                    label="MSPS Employee (10%)"
                    value={fmt(report.TotalMSPS_Employee)}
                    color="text-blue-600"
                  />
                  <StatCard
                    label="MSPS Employer (12%)"
                    value={fmt(report.TotalMSPS_Employer)}
                    color="text-indigo-600"
                  />
                  <StatCard
                    label="Total MSPS"
                    value={fmt(report.TotalMSPS)}
                    color="text-slate-900"
                  />
                </div>
                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">
                      MSPS Contribution Details
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportCSV(report.Records || [], "msps-contributions")
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> CSV
                    </Button>
                  </CardHeader>
                  <Separator />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>EPF No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Basic Salary</TableHead>
                        <TableHead>MSPS Emp (10%)</TableHead>
                        <TableHead>MSPS Employer (12%)</TableHead>
                        <TableHead>Total MSPS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.Records || []).map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">
                            {r.CompanyName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.DepartmentName}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {r.EPF_No}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            {r.EmployeeName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.BasicSalary)}
                          </TableCell>
                          <TableCell className="text-xs text-blue-600 font-semibold">
                            {fmt(r.MSPS_Employee)}
                          </TableCell>
                          <TableCell className="text-xs text-indigo-600 font-semibold">
                            {fmt(r.MSPS_Employer)}
                          </TableCell>
                          <TableCell className="text-sm font-bold">
                            {fmt(r.Total_MSPS)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!report.Records?.length && (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-10 text-slate-400"
                          >
                            No MSPS records
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* ══ 8. PAYE TAX ════════════════════════════════════════════════ */}
        {!loading && activeTab === "paye-tax" && (
          <TabsContent value="paye-tax" className="space-y-5 mt-4">
            <div className="flex justify-end gap-2">
              <DownloadBtn
                label="Excel"
                icon={FileSpreadsheet}
                onClick={() =>
                  dlExcel(
                    () => reportApi.payeTaxExcel(cid, pid),
                    "PAYETaxReport",
                  )
                }
              />
              <DownloadBtn
                label="PDF"
                icon={FileText}
                onClick={() =>
                  dlPdf(() => reportApi.payeTaxPdf(cid, pid), "PAYETaxReport")
                }
              />
            </div>
            {!report ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label="Total PAYE Tax"
                    value={fmt(report.TotalPAYE)}
                    color="text-red-500"
                  />
                  <StatCard
                    label="Total SSL Tax (2.5%)"
                    value={fmt(report.TotalSSL)}
                    color="text-amber-600"
                  />
                </div>
                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">
                      PAYE Tax Details
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportCSV(report.Records || [], "paye-tax")
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> CSV
                    </Button>
                  </CardHeader>
                  <Separator />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>EPF No</TableHead>
                        <TableHead>NIC</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Basic</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>PAYE Tax</TableHead>
                        <TableHead>SSL Tax</TableHead>
                        <TableHead>Net Salary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.Records || []).map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">
                            {r.CompanyName}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {r.EPF_No}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {r.NIC || "—"}
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            {r.EmployeeName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.BasicSalary)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmt(r.GrossSalary)}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-red-500">
                            {fmt(r.PAYE_Tax)}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-amber-600">
                            {fmt(r.SSL_Tax)}
                          </TableCell>
                          <TableCell className="text-sm font-bold text-emerald-600">
                            {fmt(r.NetSalary)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!report.Records?.length && (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-10 text-slate-400"
                          >
                            No PAYE records for this period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* ══ 9. MONTHLY DEPARTMENT COST ══════════════════════════════════ */}
        {!loading && activeTab === "monthly-dept-cost" && (
          <TabsContent value="monthly-dept-cost" className="space-y-5 mt-4">
            <div className="flex justify-end gap-2">
              <DownloadBtn
                label="Excel"
                icon={FileSpreadsheet}
                onClick={() =>
                  dlExcel(
                    () => reportApi.monthlyDepartmentCostExcel(cid, yr),
                    "MonthlyDeptCost",
                  )
                }
              />
              <DownloadBtn
                label="PDF"
                icon={FileText}
                onClick={() =>
                  dlPdf(
                    () => reportApi.monthlyDepartmentCostPdf(cid, yr),
                    "MonthlyDeptCost",
                  )
                }
              />
            </div>
            {!report?.length ? (
              <EmptyState />
            ) : (
              <>
                {/* Stacked bar chart */}
                <Card className="border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Monthly Cost by Department — {filters.year}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={MONTHS.map((m, idx) => ({
                          month: m,
                          ...Object.fromEntries(
                            report.map((d: any) => [
                              d.DepartmentName,
                              d.MonthlyCost?.[idx + 1] ?? 0,
                            ]),
                          ),
                        }))}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            fontSize: "12px",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        {report.map((d: any, i: number) => (
                          <Bar
                            key={d.DepartmentName}
                            dataKey={d.DepartmentName}
                            stackId="a"
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                            radius={
                              i === report.length - 1 ? [4, 4, 0, 0] : undefined
                            }
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Pivot table */}
                <Card className="border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Monthly Department Cost Pivot
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-white z-10">
                            Department
                          </TableHead>
                          {MONTHS.map((m) => (
                            <TableHead key={m} className="text-center">
                              {m}
                            </TableHead>
                          ))}
                          <TableHead className="text-right font-bold">
                            Total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.map((d: any, i: number) => {
                          const rowTotal = MONTHS.reduce(
                            (sum, _, idx) =>
                              sum + (d.MonthlyCost?.[idx + 1] ?? 0),
                            0,
                          );
                          return (
                            <TableRow key={i}>
                              <TableCell className="font-semibold text-sm sticky left-0 bg-white">
                                {d.DepartmentName}
                              </TableCell>
                              {MONTHS.map((_, idx) => (
                                <TableCell
                                  key={idx}
                                  className="text-xs text-right"
                                >
                                  {d.MonthlyCost?.[idx + 1]
                                    ? fmt(d.MonthlyCost[idx + 1])
                                    : "—"}
                                </TableCell>
                              ))}
                              <TableCell className="text-sm font-bold text-right text-emerald-600">
                                {fmt(rowTotal)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Grand total row */}
                        <TableRow className="bg-slate-50 font-bold">
                          <TableCell className="sticky left-0 bg-slate-50 text-sm font-bold">
                            GRAND TOTAL
                          </TableCell>
                          {MONTHS.map((_, idx) => {
                            const colTotal = report.reduce(
                              (sum: number, d: any) =>
                                sum + (d.MonthlyCost?.[idx + 1] ?? 0),
                              0,
                            );
                            return (
                              <TableCell
                                key={idx}
                                className="text-xs text-right font-bold"
                              >
                                {fmt(colTotal)}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-sm font-bold text-right text-emerald-600">
                            {fmt(
                              report.reduce(
                                (sum: number, d: any) =>
                                  sum +
                                  MONTHS.reduce(
                                    (s, _, idx) =>
                                      s + (d.MonthlyCost?.[idx + 1] ?? 0),
                                    0,
                                  ),
                                0,
                              ),
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* ══ 10. PAYROLL FULL DETAILED ════════════════════════════════════ */}
        {!loading && activeTab === "payroll-full-detailed" && (
          <TabsContent value="payroll-full-detailed" className="space-y-5 mt-4">
            <div className="flex justify-end gap-2">
              <DownloadBtn
                label="PDF"
                icon={FileText}
                onClick={() =>
                  dlPdf(
                    () => reportApi.payrollFullDetailedPdf(cid, pid, did),
                    "PayrollFullDetailed",
                  )
                }
              />
            </div>
            {!report?.Records?.length ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {report.Records.map((emp: any, i: number) => (
                  <EmployeeDetailCard key={i} emp={emp} />
                ))}
              </div>
            )}
          </TabsContent>
        )}

       

        {!loading && !report && (
          <div className="py-24 text-center">
            <FileBarChart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">
              Configure filters and load a report
            </p>
          </div>
        )}
      </Tabs>
    </div>
  );
}

// ─── Employee Detail Card (for Full Detailed report) ──────────────────────────
function EmployeeDetailCard({ emp }: { emp: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="border-slate-200 shadow-none">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 rounded-xl">
            <AvatarFallback className="rounded-xl text-xs font-bold">
              {emp.EmployeeName?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {emp.EmployeeName}
            </p>
            <p className="text-xs text-slate-400">
              {emp.EPF_No} · {emp.DepartmentName} · {emp.DaysWorked} days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">
              Gross
            </p>
            <p className="text-sm font-semibold">{fmt(emp.GrossSalary)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">
              Net
            </p>
            <p className="text-sm font-bold text-emerald-600">
              {fmt(emp.NetSalary)}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>
      {expanded && (
        <>
          <Separator />
          <div className="p-4 space-y-4">
            {/* Summary grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                ["Basic", fmt(emp.BasicSalary)],
                ["Gross", fmt(emp.GrossSalary)],
                ["Deductions", fmt(emp.Deduction_Total)],
                ["EPF Emp", fmt(emp.EPF_Employee)],
                ["EPF Empl", fmt(emp.EPF_Employer)],
                ["ETF", fmt(emp.ETF)],
                ["MSPS Emp", fmt(emp.MSPS_Employee)],
                ["MSPS Empl", fmt(emp.MSPS_Employer)],
                ["PAYE", fmt(emp.PAYE_Tax)],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-bold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            {/* Line items */}
            {emp.LineItems?.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emp.LineItems.map((li: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">
                        {li.Description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            li.Line_Type === "ALLOWANCE"
                              ? "default"
                              : li.Line_Type === "DEDUCTION"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {li.Line_Type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {li.Category || "—"}
                      </TableCell>
                      <TableCell
                        className={`text-xs text-right font-semibold ${li.Line_Type === "DEDUCTION" ? "text-red-500" : "text-emerald-600"}`}
                      >
                        {fmt(li.Amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
