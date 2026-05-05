"use client";
import { useEffect, useRef, useState } from "react";
import { employeeApi, departmentApi } from "@/lib/api";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Building2,
  Briefcase,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { fmt } from "@/lib/utils";
import * as XLSX from "xlsx";

interface ImportRow {
  row: number;
  EPF_No: string;
  FirstName: string;
  LastName: string;
  FullName: string;
  NameWithInitials?: string;
  NIC?: string;
  DateOfBirth?: string;
  JoinDate?: string;
  Address?: string;
  ContactNo?: string;
  Department?: string;
  Designation?: string;
  BasicSalary: number;
  EPF_Eligible: number;
  BankAccount_No?: string;
  Bank_Name?: string;
  Branch_Name?: string;
  Branch_Code?: string;
  Is_Primary?: number;
  _valid: boolean;
  _errors: string[];
}

const EMPTY_FORM = {
  EPF_No: "",
  FirstName: "",
  LastName: "",
  FullName: "",
  NameWithInitials: "",
  NIC: "",
  Designation_ID: "",
  Department_ID: "",
  BasicSalary: "",
  EPF_Eligible: "1",
  DateOfBirth: "",
  JoinDate: "",
  Address: "",
  ContactNo: "",
  BankDetail: {
    BankAccount_No: "",
    Bank_Name: "",
    Branch_Name: "",
    Branch_Code: "",
    Is_Primary: 1,
  },
};

function parseDate(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === "number") {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split("T")[0];
  }
  const s = String(val).trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return `${y}-${m}-${d}`;
  }
  return s;
}

function parseBool(val: any): number {
  if (val === undefined || val === null || val === "") return 1;
  return /^yes$/i.test(String(val).trim()) ? 1 : 0;
}

function mapRow(raw: Record<string, any>, rowNum: number): ImportRow {
  const epf = String(raw["EPF No *"] ?? raw["EPF No"] ?? "").trim();
  const first = String(raw["First Name *"] ?? raw["First Name"] ?? "").trim();
  const last = String(raw["Last Name *"] ?? raw["Last Name"] ?? "").trim();
  const full = String(raw["Full Name *"] ?? raw["Full Name"] ?? "").trim();
  const salary =
    parseFloat(
      String(raw["Basic Salary *"] ?? raw["Basic Salary"] ?? "0").replace(
        /[^0-9.]/g,
        "",
      ),
    ) || 0;
  const epfElig = parseBool(raw["EPF Eligible *"] ?? raw["EPF Eligible"]);
  const errors: string[] = [];
  if (!epf) errors.push("EPF No is required");
  if (!first) errors.push("First Name is required");
  if (!last) errors.push("Last Name is required");
  if (!full) errors.push("Full Name is required");
  if (salary <= 0) errors.push("Basic Salary must be > 0");
  return {
    row: rowNum,
    EPF_No: epf,
    FirstName: first,
    LastName: last,
    FullName: full,
    NameWithInitials:
      String(raw["Name With Initials"] ?? "").trim() || undefined,
    NIC: String(raw["NIC"] ?? "").trim() || undefined,
    DateOfBirth: parseDate(raw["Date of Birth"]),
    JoinDate: parseDate(raw["Join Date"]),
    Address: String(raw["Address"] ?? "").trim() || undefined,
    ContactNo: String(raw["Contact No"] ?? "").trim() || undefined,
    Department: String(raw["Department"] ?? "").trim() || undefined,
    Designation: String(raw["Designation"] ?? "").trim() || undefined,
    BasicSalary: salary,
    EPF_Eligible: epfElig,
    BankAccount_No: String(raw["Bank Account No"] ?? "").trim() || undefined,
    Bank_Name: String(raw["Bank Name"] ?? "").trim() || undefined,
    Branch_Name: String(raw["Branch Name"] ?? "").trim() || undefined,
    Branch_Code: String(raw["Branch Code"] ?? "").trim() || undefined,
    Is_Primary: parseBool(raw["Is Primary Bank"]),
    _valid: errors.length === 0,
    _errors: errors,
  };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"create" | "edit" | "view" | null>(
    null,
  );
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deptModal, setDeptModal] = useState<"create" | "edit" | null>(null);
  const [deptSelected, setDeptSelected] = useState<any>(null);
  const [deptName, setDeptName] = useState("");
  const [deptSaving, setDeptSaving] = useState(false);
  const [desigModal, setDesigModal] = useState<"create" | "edit" | null>(null);
  const [desigSelected, setDesigSelected] = useState<any>(null);
  const [desigName, setDesigName] = useState("");
  const [desigSaving, setDesigSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "result">(
    "upload",
  );
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    ok: number;
    failed: number;
    errors: string[];
  }>({ ok: 0, failed: 0, errors: [] });
  const [missingEntities, setMissingEntities] = useState<{
    departments: string[];
    designations: string[];
  }>({ departments: [], designations: [] });
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [creatingMissing, setCreatingMissing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (q?: string) => {
    setLoading(true);
    try {
      const [eRes, dRes, dgRes] = await Promise.all([
        employeeApi.getAll(q || undefined),
        departmentApi.getAll(),
        departmentApi.getDesignations(),
      ]);
      setEmployees(eRes.data?.Data || []);
      setDepartments(dRes.data?.Data || []);
      setDesignations(dgRes.data?.Data || []);
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const f = (field: string, val: string) =>
    setForm((p: any) => ({ ...p, [field]: val }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModalType("create");
  };
  const openEdit = (emp: any) => {
    setForm({
      ...emp,
      Designation_ID: String(emp.Designation_ID || ""),
      Department_ID: String(emp.Department_ID || ""),
      EPF_Eligible: String(emp.EPF_Eligible ?? 1),
    });
    setSelected(emp);
    setModalType("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        BasicSalary: parseFloat(form.BasicSalary) || 0,
        EPF_Eligible: parseInt(form.EPF_Eligible),
        Designation_ID: form.Designation_ID
          ? parseInt(form.Designation_ID)
          : null,
        Department_ID: form.Department_ID ? parseInt(form.Department_ID) : null,
      };
      if (!payload.BankDetail?.BankAccount_No) delete payload.BankDetail;
      if (modalType === "create") {
        await employeeApi.create(payload);
        toast.success("Employee created successfully");
      } else {
        await employeeApi.update(selected.EmployeeID, payload);
        toast.success("Employee updated successfully");
      }
      setModalType(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error saving employee");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deactivate this employee?")) return;
    try {
      await employeeApi.delete(id);
      toast.success("Employee deactivated");
      load();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  const saveDept = async () => {
    if (!deptName.trim()) return toast.error("Name required");
    setDeptSaving(true);
    try {
      if (deptModal === "edit" && deptSelected)
        await departmentApi.update(deptSelected.Department_ID, {
          Department_Name: deptName,
        });
      else await departmentApi.create({ Department_Name: deptName });
      toast.success(deptModal === "edit" ? "Updated" : "Created");
      setDeptModal(null);
      setDeptName("");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setDeptSaving(false);
  };

  const deleteDept = async (id: number) => {
    if (!confirm("Delete this department?")) return;
    try {
      await departmentApi.delete(id);
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.Message || "Cannot delete — employees assigned",
      );
    }
  };

  const saveDesig = async () => {
    if (!desigName.trim()) return toast.error("Name required");
    setDesigSaving(true);
    try {
      await departmentApi.createDesignation({ Designation_Name: desigName });
      toast.success("Created");
      setDesigModal(null);
      setDesigName("");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setDesigSaving(false);
  };

  // ── Excel Import ──────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: false });
        const sheetName = wb.SheetNames.includes("Employee Import")
          ? "Employee Import"
          : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json<any[]>(ws, {
          header: 1,
          defval: "",
          blankrows: false,
        }) as any[][];
        let headerIdx = -1;
        for (let i = 0; i < Math.min(10, raw.length); i++) {
          if (
            raw[i]
              .map((c: any) => String(c))
              .join("|")
              .includes("EPF No")
          ) {
            headerIdx = i;
            break;
          }
        }
        if (headerIdx === -1) {
          toast.error("Cannot find header row. Use the PayrollPro template.");
          return;
        }
        const headers: string[] = raw[headerIdx].map((h: any) =>
          String(h).trim(),
        );
        const parsed: ImportRow[] = raw
          .slice(headerIdx + 1)
          .filter((row) => row.some((c: any) => c !== ""))
          .map((row, i) => {
            const obj: Record<string, any> = {};
            headers.forEach((h, ci) => {
              obj[h] = row[ci];
            });
            return mapRow(obj, headerIdx + 2 + i);
          });
        if (parsed.length === 0) {
          toast.error("No data rows found.");
          return;
        }
        setImportRows(parsed);
        setImportStep("preview");
      } catch (err) {
        toast.error("Failed to parse file. Use the official template.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const checkMissingEntities = () => {
    const valid = importRows.filter((r) => r._valid);
    const uniqueDepts = new Set(
      valid
        .map((r) => r.Department?.toLowerCase().trim())
        .filter((d) => d && d.length > 0)
    );
    const uniqueDesigs = new Set(
      valid
        .map((r) => r.Designation?.toLowerCase().trim())
        .filter((d) => d && d.length > 0)
    );

    const existingDepts = new Set(
      departments.map((d) => d.Department_Name.toLowerCase())
    );
    const existingDesigs = new Set(
      designations.map((d) => d.Designation_Name.toLowerCase())
    );

    const missingDepts = Array.from(uniqueDepts).filter(
      (d) => !existingDepts.has(d)
    );
    const missingDesigs = Array.from(uniqueDesigs).filter(
      (d) => !existingDesigs.has(d)
    );

    return {
      departments: missingDepts,
      designations: missingDesigs,
    };
  };

  const createMissingEntities = async () => {
    setCreatingMissing(true);
    try {
      // Create missing departments
      for (const deptName of missingEntities.departments) {
        await departmentApi.create({
          Department_Name: deptName.charAt(0).toUpperCase() + deptName.slice(1),
        });
      }

      // Create missing designations
      for (const desigName of missingEntities.designations) {
        await departmentApi.createDesignation({
          Designation_Name:
            desigName.charAt(0).toUpperCase() + desigName.slice(1),
        });
      }

      // Reload departments and designations
      await load();
      toast.success(
        `Created ${missingEntities.departments.length} department(s) and ${missingEntities.designations.length} designation(s)`
      );
      setShowMissingDialog(false);
      setMissingEntities({ departments: [], designations: [] });

      // Now proceed with import
      await runImport();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error creating entities");
    } finally {
      setCreatingMissing(false);
    }
  };

  const handleProceedToImport = () => {
    const missing:any = checkMissingEntities();
    if (
      missing.departments.length > 0 ||
      missing.designations.length > 0
    ) {
      setMissingEntities(missing);
      setShowMissingDialog(true);
    } else {
      runImport();
    }
  };

  const runImport = async () => {
    const valid = importRows.filter((r) => r._valid);
    if (!valid.length) return toast.error("No valid rows");
    setImporting(true);
    let ok = 0;
    const errors: string[] = [];
    for (const row of valid) {
      try {
        const dept = departments.find(
          (d) =>
            d.Department_Name.toLowerCase() ===
            (row.Department || "").toLowerCase(),
        );
        const desig = designations.find(
          (d) =>
            d.Designation_Name.toLowerCase() ===
            (row.Designation || "").toLowerCase(),
        );
        const payload: any = {
          EPF_No: row.EPF_No,
          FirstName: row.FirstName,
          LastName: row.LastName,
          FullName: row.FullName,
          NameWithInitials: row.NameWithInitials || null,
          NIC: row.NIC || null,
          DateOfBirth: row.DateOfBirth || null,
          JoinDate: row.JoinDate || null,
          Address: row.Address || null,
          ContactNo: row.ContactNo || null,
          Department_ID: dept?.Department_ID || null,
          Designation_ID: desig?.Designation_ID || null,
          BasicSalary: row.BasicSalary,
          EPF_Eligible: row.EPF_Eligible,
          Created_by: 1,
        };
        if (row.BankAccount_No)
          payload.BankDetail = {
            BankAccount_No: row.BankAccount_No,
            Bank_Name: row.Bank_Name || "",
            Branch_Name: row.Branch_Name || "",
            Branch_Code: row.Branch_Code || "",
            Is_Primary: row.Is_Primary ?? 1,
          };
        await employeeApi.create(payload);
        ok++;
      } catch (e: any) {
        errors.push(
          `Row ${row.row} (${row.EPF_No}): ${e?.response?.data?.Message || "Error"}`,
        );
      }
    }
    setImportResult({ ok, failed: errors.length, errors });
    setImportStep("result");
    setImporting(false);
    if (ok > 0) load();
  };

  const resetImport = () => {
    setImportRows([]);
    setImportStep("upload");
    setImportResult({ ok: 0, failed: 0, errors: [] });
    setMissingEntities({ departments: [], designations: [] });
    setShowMissingDialog(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validCount = importRows.filter((r) => r._valid).length;
  const invalidCount = importRows.filter((r) => !r._valid).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Employees
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {employees.length} total employees in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Building2 className="w-4 h-4" /> Departments & Designations
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetImport();
              setImportOpen(true);
            }}
          >
            <Upload className="w-4 h-4" /> Import Excel
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search by name, EPF No, NIC, contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(search)}
              />
            </div>
            <Button onClick={() => load(search)}>Search</Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                load("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee table */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Employee Directory</CardTitle>
        </CardHeader>
        <Separator className="mt-4" />
        {loading ? (
          <CardContent className="py-16 text-center text-slate-400 text-sm">
            Loading employees...
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>EPF No</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>EPF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.EmployeeID}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-[10px]">
                          {emp.FullName?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {emp.FullName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {emp.NIC || emp.ContactNo || "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md">
                      {emp.EPF_No}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {emp.DepartmentName || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {emp.DesignationName || "—"}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-800">
                    {fmt(emp.BasicSalary)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.EPF_Eligible ? "success" : "secondary"}>
                      {emp.EPF_Eligible ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={emp.Status === 1 ? "success" : "destructive"}
                    >
                      {emp.Status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setSelected(emp);
                          setModalType("view");
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(emp)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleDelete(emp.EmployeeID)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-slate-400"
                  >
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ═══ MISSING ENTITIES CONFIRMATION DIALOG ═══ */}
      <Dialog open={showMissingDialog} onOpenChange={setShowMissingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Create Missing Departments & Designations?
            </DialogTitle>
            <DialogDescription>
              The following departments and designations don't exist in the
              system. Would you like to create them before importing?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {missingEntities.departments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-semibold text-slate-700">
                    Missing Departments ({missingEntities.departments.length})
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingEntities.departments.map((dept, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                    >
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {missingEntities.designations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-500" />
                  <p className="text-sm font-semibold text-slate-700">
                    Missing Designations ({missingEntities.designations.length}
                    )
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingEntities.designations.map((desig, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-purple-50 border-purple-200 text-purple-700"
                    >
                      {desig.charAt(0).toUpperCase() + desig.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowMissingDialog(false);
                setMissingEntities({ departments: [], designations: [] });
              }}
              disabled={creatingMissing}
            >
              Cancel Import
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowMissingDialog(false);
                runImport();
              }}
              disabled={creatingMissing}
            >
              Skip & Import Anyway
            </Button>
            <Button onClick={createMissingEntities} disabled={creatingMissing}>
              {creatingMissing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Create & Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EXCEL IMPORT DIALOG ═══ */}
      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          if (!open) resetImport();
          setImportOpen(open);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Import Employees from Excel
            </DialogTitle>
            <DialogDescription>
              Upload the PayrollPro Excel template to bulk-add employees
            </DialogDescription>
          </DialogHeader>

          {/* Steps */}
          <div className="flex items-center gap-2 text-xs font-semibold mb-1">
            {(["upload", "preview", "result"] as const).map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${importStep === step ? "bg-slate-900 text-white" : ["preview", "result"].indexOf(importStep) > i ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}
                >
                  {["preview", "result"].indexOf(importStep) > i ? "✓" : i + 1}
                </div>
                <span
                  className={
                    importStep === step ? "text-slate-800" : "text-slate-400"
                  }
                >
                  {step === "upload"
                    ? "Upload File"
                    : step === "preview"
                      ? "Review Data"
                      : "Results"}
                </span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-slate-300" />}
              </div>
            ))}
          </div>
          <Separator />

          {/* Step 1 */}
          {importStep === "upload" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    Need the import template?
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Download the official PayrollPro Excel template
                  </p>
                </div>
                <a href="/employee_import_template.xlsx" download>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Template
                  </Button>
                </a>
              </div>
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && fileRef.current) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileRef.current.files = dt.files;
                    handleFileChange({ target: fileRef.current } as any);
                  }
                }}
              >
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports .xlsx and .xls files
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                {[
                  "Use the official PayrollPro template for best results",
                  "Date format must be YYYY-MM-DD (e.g. 1990-05-22)",
                  "Missing departments & designations will be created automatically",
                  'EPF Eligible column must be "Yes" or "No"',
                ].map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {importStep === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-emerald-700">
                    {validCount} valid
                  </span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-700">
                      {invalidCount} with errors
                    </span>
                  </div>
                )}
                <span className="text-xs text-slate-400 ml-auto">
                  {importRows.length} rows read
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden max-h-[380px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>EPF No</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Basic Salary</TableHead>
                      <TableHead>EPF</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importRows.map((row) => (
                      <TableRow
                        key={row.row}
                        className={!row._valid ? "bg-red-50/50" : ""}
                      >
                        <TableCell className="text-xs text-slate-400">
                          {row.row}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                            {row.EPF_No || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {row.FullName || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {row.Department || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {row.Designation || "—"}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {row.BasicSalary > 0
                            ? `LKR ${row.BasicSalary.toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={row.EPF_Eligible ? "success" : "secondary"}
                          >
                            {row.EPF_Eligible ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row._valid ? (
                            <Badge variant="success">Ready</Badge>
                          ) : (
                            <div className="group relative">
                              <Badge
                                variant="destructive"
                                className="cursor-help"
                              >
                                Error
                              </Badge>
                              <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 bg-slate-900 text-white text-xs rounded-lg p-2 w-52 shadow-xl">
                                {row._errors.map((e, i) => (
                                  <div key={i}>• {e}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {invalidCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {invalidCount} row(s) with errors will be skipped. Only{" "}
                  {validCount} valid row(s) will be imported. Hover "Error" to
                  see details.
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {importStep === "result" && (
            <div className="space-y-4">
              <div
                className={`p-6 rounded-xl border text-center ${importResult.ok > 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
              >
                {importResult.ok > 0 ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                )}
                <p className="text-lg font-bold text-slate-800 mb-1">
                  {importResult.ok > 0
                    ? `${importResult.ok} employee${importResult.ok > 1 ? "s" : ""} imported successfully`
                    : "Import failed"}
                </p>
                {importResult.failed > 0 && (
                  <p className="text-sm text-red-600">
                    {importResult.failed} row(s) failed
                  </p>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 max-h-48 overflow-y-auto space-y-1">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">
                    Failed rows
                  </p>
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 font-mono">
                      {e}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {importStep === "upload" && (
              <Button variant="outline" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
            )}
            {importStep === "preview" && (
              <>
                <Button variant="outline" onClick={resetImport}>
                  ← Back
                </Button>
                <Button
                  onClick={handleProceedToImport}
                  disabled={importing || validCount === 0}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Import {validCount}{" "}
                      Employee{validCount !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </>
            )}
            {importStep === "result" && (
              <>
                <Button variant="outline" onClick={resetImport}>
                  Import Another File
                </Button>
                <Button
                  onClick={() => {
                    setImportOpen(false);
                    resetImport();
                  }}
                >
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rest of the dialogs remain the same... */}
      {/* ═══ DEPARTMENTS & DESIGNATIONS DIALOG ═══ */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Departments & Designations</DialogTitle>
            <DialogDescription>
              Manage departments and job designations used across the system
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="departments">
            <TabsList>
              <TabsTrigger value="departments">
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                Departments
              </TabsTrigger>
              <TabsTrigger value="designations">
                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                Designations
              </TabsTrigger>
            </TabsList>
            <TabsContent value="departments" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setDeptName("");
                    setDeptSelected(null);
                    setDeptModal("create");
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Department
                </Button>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((d) => (
                      <TableRow key={d.Department_ID}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                              <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                            <span className="text-sm font-semibold">
                              {d.Department_Name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {d.Created_Date
                            ? new Date(d.Created_Date).toLocaleDateString(
                                "en-LK",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setDeptSelected(d);
                                setDeptName(d.Department_Name);
                                setDeptModal("edit");
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => deleteDept(d.Department_ID)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {departments.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-8 text-slate-400 text-sm"
                        >
                          No departments yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="designations" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setDesigName("");
                    setDesigSelected(null);
                    setDesigModal("create");
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Designation
                </Button>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Designation Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designations.map((d) => (
                      <TableRow key={d.Designation_ID}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
                              <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                            </div>
                            <span className="text-sm font-semibold">
                              {d.Designation_Name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {d.Created_Date
                            ? new Date(d.Created_Date).toLocaleDateString(
                                "en-LK",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setDesigSelected(d);
                                setDesigName(d.Designation_Name);
                                setDesigModal("edit");
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {designations.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-8 text-slate-400 text-sm"
                        >
                          No designations yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Dept dialog ── */}
      <Dialog
        open={deptModal !== null}
        onOpenChange={(o) => !o && setDeptModal(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {deptModal === "edit" ? "Edit Department" : "Add Department"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Department Name</Label>
            <Input
              placeholder="e.g. Human Resources"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveDept()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptModal(null)}>
              Cancel
            </Button>
            <Button onClick={saveDept} disabled={deptSaving}>
              {deptSaving
                ? "Saving..."
                : deptModal === "edit"
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Desig dialog ── */}
      <Dialog
        open={desigModal !== null}
        onOpenChange={(o) => !o && setDesigModal(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {desigModal === "edit" ? "Edit Designation" : "Add Designation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Designation Name</Label>
            <Input
              placeholder="e.g. Senior Software Engineer"
              value={desigName}
              onChange={(e) => setDesigName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveDesig()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesigModal(null)}>
              Cancel
            </Button>
            <Button onClick={saveDesig} disabled={desigSaving}>
              {desigSaving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE / EDIT EMPLOYEE ═══ */}
      <Dialog
        open={modalType === "create" || modalType === "edit"}
        onOpenChange={(open) => !open && setModalType(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modalType === "create" ? "Add New Employee" : "Edit Employee"}
            </DialogTitle>
            <DialogDescription>
              Fill in the employee details below
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="personal">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="job">Job Details</TabsTrigger>
              {modalType === "create" && (
                <TabsTrigger value="bank">Bank Details</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="personal" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>EPF Number</Label>
                  <Input
                    value={form.EPF_No}
                    onChange={(e) => f("EPF_No", e.target.value)}
                    placeholder="EPF001"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>NIC</Label>
                  <Input
                    value={form.NIC}
                    onChange={(e) => f("NIC", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input
                    value={form.FirstName}
                    onChange={(e) => f("FirstName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input
                    value={form.LastName}
                    onChange={(e) => f("LastName", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    value={form.FullName}
                    onChange={(e) => f("FullName", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Name With Initials</Label>
                  <Input
                    value={form.NameWithInitials}
                    onChange={(e) => f("NameWithInitials", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.DateOfBirth?.substring(0, 10) || ""}
                    onChange={(e) => f("DateOfBirth", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact No</Label>
                  <Input
                    value={form.ContactNo}
                    onChange={(e) => f("ContactNo", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Address</Label>
                  <Input
                    value={form.Address}
                    onChange={(e) => f("Address", e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="job" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Department</Label>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline font-medium"
                      onClick={() => {
                        setDeptName("");
                        setDeptSelected(null);
                        setDeptModal("create");
                      }}
                    >
                      + New
                    </button>
                  </div>
                  <Select
                    value={form.Department_ID}
                    onValueChange={(v) => f("Department_ID", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Designation</Label>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline font-medium"
                      onClick={() => {
                        setDesigName("");
                        setDesigSelected(null);
                        setDesigModal("create");
                      }}
                    >
                      + New
                    </button>
                  </div>
                  <Select
                    value={form.Designation_ID}
                    onValueChange={(v) => f("Designation_ID", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {designations.map((d) => (
                        <SelectItem
                          key={d.Designation_ID}
                          value={String(d.Designation_ID)}
                        >
                          {d.Designation_Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Basic Salary (LKR)</Label>
                  <Input
                    type="number"
                    value={form.BasicSalary}
                    onChange={(e) => f("BasicSalary", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>EPF Eligible</Label>
                  <Select
                    value={String(form.EPF_Eligible)}
                    onValueChange={(v) => f("EPF_Eligible", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Yes</SelectItem>
                      <SelectItem value="0">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Join Date</Label>
                  <Input
                    type="date"
                    value={form.JoinDate?.substring(0, 10) || ""}
                    onChange={(e) => f("JoinDate", e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            {modalType === "create" && (
              <TabsContent value="bank" className="space-y-3 mt-4">
                <p className="text-xs text-slate-500">
                  Optional — add primary bank account details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Account Number</Label>
                    <Input
                      value={form.BankDetail.BankAccount_No}
                      onChange={(e) =>
                        setForm((p: any) => ({
                          ...p,
                          BankDetail: {
                            ...p.BankDetail,
                            BankAccount_No: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bank Name</Label>
                    <Input
                      value={form.BankDetail.Bank_Name}
                      onChange={(e) =>
                        setForm((p: any) => ({
                          ...p,
                          BankDetail: {
                            ...p.BankDetail,
                            Bank_Name: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Branch Name</Label>
                    <Input
                      value={form.BankDetail.Branch_Name}
                      onChange={(e) =>
                        setForm((p: any) => ({
                          ...p,
                          BankDetail: {
                            ...p.BankDetail,
                            Branch_Name: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Branch Code</Label>
                    <Input
                      value={form.BankDetail.Branch_Code}
                      onChange={(e) =>
                        setForm((p: any) => ({
                          ...p,
                          BankDetail: {
                            ...p.BankDetail,
                            Branch_Code: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Saving..."
                : modalType === "create"
                  ? "Create Employee"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ VIEW DIALOG ═══ */}
      <Dialog
        open={modalType === "view"}
        onOpenChange={(open) => !open && setModalType(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Avatar className="w-14 h-14 rounded-xl">
                  <AvatarFallback className="rounded-xl text-lg">
                    {selected.FullName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900 text-base">
                    {selected.FullName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selected.DesignationName} • {selected.DepartmentName}
                  </p>
                  <Badge
                    className="mt-1"
                    variant={selected.Status === 1 ? "success" : "destructive"}
                  >
                    {selected.Status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  ["EPF Number", selected.EPF_No],
                  ["NIC", selected.NIC || "—"],
                  ["Contact", selected.ContactNo || "—"],
                  ["Basic Salary", fmt(selected.BasicSalary)],
                  ["EPF Eligible", selected.EPF_Eligible ? "Yes" : "No"],
                  [
                    "Join Date",
                    selected.JoinDate
                      ? new Date(selected.JoinDate).toLocaleDateString("en-LK")
                      : "—",
                  ],
                  ["Address", selected.Address || "—"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm"
                  >
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
              {selected.BankDetails?.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                    Primary Bank
                  </p>
                  <p className="text-sm text-slate-700">
                    {selected.BankDetails[0].Bank_Name} —{" "}
                    {selected.BankDetails[0].BankAccount_No}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}