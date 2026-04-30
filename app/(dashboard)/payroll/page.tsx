"use client";
import { useEffect, useState } from "react";
import { payrollApi, periodApi, employeeApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, Zap, Trash2, Calendar, ChevronRight } from "lucide-react";
import { fmt } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const statusVariant: Record<string, any> = {
  PAID: "success",
  APPROVED: "info",
  CALCULATED: "warning",
  CANCELLED: "destructive",
  DRAFT: "slate",
  PROCESSING: "warning",
  LOCKED: "default",
};

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("periods");
  const [periods, setPeriods] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"period" | "generate" | null>(null);
  const [saving, setSaving] = useState(false);
  const [periodForm, setPeriodForm] = useState({
    Period_Name: "",
    Period_Year: new Date().getFullYear(),
    Period_Month: new Date().getMonth() + 1,
    Start_Date: "",
    End_Date: "",
    Created_by: 1,
  });
  const [genForm, setGenForm] = useState({
    Period_ID: "",
    EmployeeID: "",
    DaysWorked: "26",
    Generated_by: 1,
  });
  // Add this new state near your other useState declarations
  const [employeeSearch, setEmployeeSearch] = useState("");

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const r = await periodApi.getAll();
      setPeriods(r.data?.Data || []);
    } catch {
      toast.error("Failed to load periods");
    }
    setLoading(false);
  };

  const loadPayrolls = async (periodId: number) => {
    setLoading(true);
    try {
      const r = await payrollApi.getAll(periodId);
      setPayrolls(r.data?.Data || []);
    } catch {
      toast.error("Failed to load payrolls");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPeriods();
    employeeApi
      .getAll()
      .then((r) => setEmployees(r.data?.Data || []))
      .catch(() => {});
  }, []);

  const createPeriod = async () => {
    setSaving(true);
    try {
      await periodApi.create(periodForm);
      toast.success("Payroll period created");
      setModal(null);
      loadPeriods();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setSaving(false);
  };

  const generateSingle = async () => {
    setSaving(true);
    try {
      await payrollApi.generate({
        Period_ID: parseInt(genForm.Period_ID),
        EmployeeID: parseInt(genForm.EmployeeID),
        DaysWorked: parseInt(genForm.DaysWorked),
        Generated_by: 1,
      });
      toast.success("Payroll generated successfully");
      setModal(null);
      if (selectedPeriod) loadPayrolls(selectedPeriod.Period_ID);
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setSaving(false);
  };

  const generateBulk = async (periodId: number) => {
    const loading = toast.loading("Generating payrolls...");
    try {
      const r = await payrollApi.generateBulk({
        Period_ID: periodId,
        DaysWorked: 26,
        Generated_by: 1,
      });
      toast.dismiss(loading);
      toast.success(r.data?.Message || "Bulk payroll generated");
      if (selectedPeriod?.Period_ID === periodId) loadPayrolls(periodId);
    } catch (e: any) {
      toast.dismiss(loading);
      toast.error(e?.response?.data?.Message || "Error");
    }
  };

  const updatePayrollStatus = async (id: number, status: string) => {
    try {
      await payrollApi.updateStatus(id, { Status: status, Updated_by: 1 });
      toast.success(`Status updated to ${status}`);
      if (selectedPeriod) loadPayrolls(selectedPeriod.Period_ID);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const updatePeriodStatus = async (id: number, status: string) => {
    try {
      await periodApi.updateStatus(id, { Status: status });
      toast.success(`Period marked as ${status}`);
      loadPeriods();
    } catch {
      toast.error("Failed to update period");
    }
  };

  const deletePayroll = async (id: number) => {
    if (!confirm("Delete this payroll record?")) return;
    try {
      await payrollApi.delete(id);
      toast.success("Deleted");
      if (selectedPeriod) loadPayrolls(selectedPeriod.Period_ID);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Payroll Management
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage payroll periods and generate payslips
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModal("generate")}>
            <Play className="w-4 h-4" /> Generate Single
          </Button>
          <Button onClick={() => setModal("period")}>
            <Plus className="w-4 h-4" /> New Period
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
          <TabsTrigger value="payrolls">
            Payroll Records{" "}
            {selectedPeriod && `— ${selectedPeriod.Period_Name}`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">All Payroll Periods</CardTitle>
            </CardHeader>
            <Separator className="mt-4" />
            {loading ? (
              <CardContent className="py-16 text-center text-slate-400 text-sm">
                Loading periods...
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Year / Month</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((p) => (
                    <TableRow key={p.Period_ID}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="font-semibold text-sm text-slate-800">
                            {p.Period_Name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {p.Period_Year} /{" "}
                        {String(p.Period_Month).padStart(2, "0")}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(p.Start_Date).toLocaleDateString("en-LK")}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(p.End_Date).toLocaleDateString("en-LK")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[p.Status] || "slate"}>
                          {p.Status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPeriod(p);
                              setActiveTab("payrolls");
                              loadPayrolls(p.Period_ID);
                            }}
                          >
                            View Records <ChevronRight className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => generateBulk(p.Period_ID)}
                          >
                            <Zap className="w-3 h-3" /> Bulk Generate
                          </Button>
                          {p.Status === "DRAFT" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updatePeriodStatus(p.Period_ID, "PROCESSING")
                              }
                            >
                              Process
                            </Button>
                          )}
                          {p.Status === "PROCESSING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updatePeriodStatus(p.Period_ID, "APPROVED")
                              }
                            >
                              Approve
                            </Button>
                          )}
                          {p.Status === "APPROVED" && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() =>
                                updatePeriodStatus(p.Period_ID, "PAID")
                              }
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {periods.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-12 text-slate-400"
                      >
                        No payroll periods created yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="payrolls">
          {selectedPeriod && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">
                Period: {selectedPeriod.Period_Name}
              </span>
              <Badge variant={statusVariant[selectedPeriod.Status] || "slate"}>
                {selectedPeriod.Status}
              </Badge>
              <span className="ml-auto text-xs text-blue-600">
                {payrolls.length} records
              </span>
            </div>
          )}
          <Card className="border-slate-200 shadow-none">
            <Separator />
            {loading ? (
              <CardContent className="py-16 text-center text-slate-400 text-sm">
                Loading payrolls...
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>EPF (Emp)</TableHead>
                    <TableHead>PAYE</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map((p) => (
                    <TableRow key={p.PayrollID}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7 rounded-lg">
                            <AvatarFallback className="rounded-lg text-[10px]">
                              {p.EmployeeName?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {p.EmployeeName}
                            </p>
                            <p className="text-xs text-slate-400">{p.EPF_No}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {fmt(p.BasicSalary)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {fmt(p.GrossSalary)}
                      </TableCell>
                      <TableCell className="text-xs text-red-500">
                        {fmt(p.EPF_Employee)}
                      </TableCell>
                      <TableCell className="text-xs text-red-500">
                        {fmt(p.PAYE_Tax)}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-slate-900">
                        {fmt(p.NetSalary)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[p.Status] || "slate"}>
                          {p.Status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 justify-end">
                          {p.Status === "CALCULATED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updatePayrollStatus(p.PayrollID, "APPROVED")
                              }
                            >
                              Approve
                            </Button>
                          )}
                          {p.Status === "APPROVED" && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() =>
                                updatePayrollStatus(p.PayrollID, "PAID")
                              }
                            >
                              Paid
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => deletePayroll(p.PayrollID)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payrolls.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-slate-400"
                      >
                        Select a period and generate payrolls
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Period Dialog */}
      <Dialog
        open={modal === "period"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payroll Period</DialogTitle>
            <DialogDescription>
              Set up a new payroll period for salary processing
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Period Name</Label>
              <Input
                placeholder="e.g. March 2025"
                value={periodForm.Period_Name}
                onChange={(e) =>
                  setPeriodForm((p) => ({ ...p, Period_Name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input
                type="number"
                value={periodForm.Period_Year}
                onChange={(e) =>
                  setPeriodForm((p) => ({
                    ...p,
                    Period_Year: parseInt(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Month</Label>
              <Select
                value={String(periodForm.Period_Month)}
                onValueChange={(v) =>
                  setPeriodForm((p) => ({ ...p, Period_Month: parseInt(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={periodForm.Start_Date}
                onChange={(e) =>
                  setPeriodForm((p) => ({ ...p, Start_Date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={periodForm.End_Date}
                onChange={(e) =>
                  setPeriodForm((p) => ({ ...p, End_Date: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={createPeriod} disabled={saving}>
              {saving ? "Creating..." : "Create Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Single Dialog */}
      <Dialog
        open={modal === "generate"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Single Payroll</DialogTitle>
            <DialogDescription>
              Generate payroll for one employee in a specific period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Payroll Period</Label>
              <Select
                value={genForm.Period_ID}
                onValueChange={(v) =>
                  setGenForm((p) => ({ ...p, Period_ID: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
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
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search by EPF Number or Name..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="text-sm"
                />
                <Select
                  value={genForm.EmployeeID}
                  onValueChange={(v) =>
                    setGenForm((p) => ({ ...p, EmployeeID: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[300px]">
                    {employees
                      .filter((e) => {
                        const query = employeeSearch.toLowerCase();
                        if (!query) return true;
                        return (
                          e.EPF_No?.toLowerCase().includes(query) ||
                          e.FullName?.toLowerCase().includes(query)
                        );
                      })
                      .map((e) => (
                        <SelectItem
                          key={e.EmployeeID}
                          value={String(e.EmployeeID)}
                        >
                          {e.FullName} ({e.EPF_No})
                        </SelectItem>
                      ))}
                    {employees.filter((e) => {
                      const query = employeeSearch.toLowerCase();
                      if (!query) return true;
                      return (
                        e.EPF_No?.toLowerCase().includes(query) ||
                        e.FullName?.toLowerCase().includes(query)
                      );
                    }).length === 0 && (
                      <div className="py-6 text-center text-sm text-slate-400">
                        No employees found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Days Worked</Label>
              <Input
                type="number"
                value={genForm.DaysWorked}
                onChange={(e) =>
                  setGenForm((p) => ({ ...p, DaysWorked: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={generateSingle} disabled={saving}>
              <Play className="w-4 h-4" />
              {saving ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
