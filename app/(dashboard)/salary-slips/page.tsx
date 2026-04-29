"use client";
import { useEffect, useState } from "react";
import { salarySlipApi, payrollApi, periodApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Download, Plus, FileText, Printer, Filter } from "lucide-react";
import { fmt } from "@/lib/utils";

export default function SalarySlipsPage() {
  const [slips, setSlips] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"generate" | "bulk" | null>(null);
  const [filterPeriod, setFilterPeriod] = useState("");
  const [genPayrollId, setGenPayrollId] = useState("");
  const [bulkPeriodId, setBulkPeriodId] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSlips = async () => {
    setLoading(true);
    try {
      const r = await salarySlipApi.getAll();
      setSlips(r.data?.Data || []);
    } catch {
      toast.error("Failed to load salary slips");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSlips();
    periodApi
      .getAll()
      .then((r) => setPeriods(r.data?.Data || []))
      .catch(() => {});
    payrollApi
      .getAll()
      .then((r) => setPayrolls(r.data?.Data || []))
      .catch(() => {});
  }, []);

  const downloadPdf = async (id: number, slipNumber: string) => {
    const t = toast.loading("Downloading PDF...");
    try {
      const res = await salarySlipApi.downloadPdf(id);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slipNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss(t);
      toast.success("PDF downloaded");
    } catch {
      toast.dismiss(t);
      toast.error("Failed to download PDF");
    }
  };

  const generateSlip = async () => {
    if (!genPayrollId) return toast.error("Select a payroll record");
    setSaving(true);
    try {
      await salarySlipApi.generate({
        PayrollID: parseInt(genPayrollId),
        Generated_by: 1,
      });
      toast.success("Salary slip generated");
      setModal(null);
      loadSlips();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Slip may already exist");
    }
    setSaving(false);
  };

  const bulkGenerate = async () => {
    if (!bulkPeriodId) return toast.error("Select a period");
    setSaving(true);
    const t = toast.loading("Generating slips...");
    try {
      const res = await salarySlipApi.bulkGenerate(parseInt(bulkPeriodId), 1);
      toast.dismiss(t);
      toast.success(res.data?.Message || "Slips generated");
      setModal(null);
      loadSlips();
    } catch (e: any) {
      toast.dismiss(t);
      toast.error(e?.response?.data?.Message || "Error");
    }
    setSaving(false);
  };

  const filtered = filterPeriod
    ? slips.filter((s) => String(s.Payroll?.Period_ID) === filterPeriod)
    : slips;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Salary Slips
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {slips.length} slips generated
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setBulkPeriodId("");
              setModal("bulk");
            }}
          >
            <Printer className="w-4 h-4" /> Bulk Generate
          </Button>
          <Button
            onClick={() => {
              setGenPayrollId("");
              setModal("generate");
            }}
          >
            <Plus className="w-4 h-4" /> Generate Slip
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <Label className="whitespace-nowrap normal-case text-sm font-medium text-slate-600">
              Filter by period:
            </Label>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All periods" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.Period_ID} value={String(p.Period_ID)}>
                    {p.Period_Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterPeriod && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterPeriod("")}
              >
                Clear
              </Button>
            )}
            <span className="ml-auto text-xs text-slate-500">
              {filtered.length} records
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Salary Slip Records</CardTitle>
          <CardDescription>
            Click download to get the PDF salary slip
          </CardDescription>
        </CardHeader>
        <Separator className="mt-4" />
        {loading ? (
          <CardContent className="py-16 text-center text-slate-400 text-sm">
            Loading salary slips...
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slip Number</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Generated Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.Slip_ID}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        {s.Slip_Number}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7 rounded-lg">
                        <AvatarFallback className="rounded-lg text-[10px]">
                          {s.Payroll?.EmployeeName?.substring(
                            0,
                            2,
                          ).toUpperCase() || "EM"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {s.Payroll?.EmployeeName || "—"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {s.Payroll?.EPF_No}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {s.Payroll?.PeriodName || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold text-slate-900">
                      {fmt(s.Payroll?.NetSalary || 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-500">
                      {s.Generated_Date
                        ? new Date(s.Generated_Date).toLocaleDateString(
                            "en-LK",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => downloadPdf(s.Slip_ID, s.Slip_Number)}
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      No salary slips found
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Generate Dialog */}
      <Dialog
        open={modal === "generate"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Salary Slip</DialogTitle>
            <DialogDescription>
              Select a payroll record to generate a salary slip
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Payroll Record</Label>
            <Select value={genPayrollId} onValueChange={setGenPayrollId}>
              <SelectTrigger>
                <SelectValue placeholder="Select payroll record..." />
              </SelectTrigger>
              <SelectContent>
                {payrolls.map((p) => (
                  <SelectItem key={p.PayrollID} value={String(p.PayrollID)}>
                    {p.EmployeeName} — {p.PeriodName} ({fmt(p.NetSalary)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={generateSlip} disabled={saving}>
              <FileText className="w-4 h-4" />
              {saving ? "Generating..." : "Generate Slip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Dialog */}
      <Dialog
        open={modal === "bulk"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Generate Salary Slips</DialogTitle>
            <DialogDescription>
              Generate salary slips for all employees in a payroll period at
              once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Payroll Period</Label>
            <Select value={bulkPeriodId} onValueChange={setBulkPeriodId}>
              <SelectTrigger>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={bulkGenerate} disabled={saving}>
              <Printer className="w-4 h-4" />
              {saving ? "Generating..." : "Bulk Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
