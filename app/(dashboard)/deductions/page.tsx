"use client";
import { useEffect, useState } from "react";
import { deductionApi, allowanceApi, employeeApi, periodApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { fmt } from "@/lib/utils";

export default function DeductionsPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);

  const [modal, setModal] = useState<
    "type" | "editType" | "deduction" | "advance" | null
  >(null);
  const [editDedModal, setEditDedModal] = useState(false);
  const [selectedDed, setSelectedDed] = useState<any>(null);

  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [typeForm, setTypeForm] = useState({
    Type_Name: "",
    Category: "FIXED",
    Description: "",
    Is_Active: "1",
  });

  const [dedForm, setDedForm] = useState({
    EmployeeID: "",
    DeductionType_ID: "",
    Method_ID: "",
    Value: "",
    Period_ID: "",
    Is_Active: 1,
    Created_by: 1,
  });

  const [editDedForm, setEditDedForm] = useState({
    Method_ID: "",
    Value: "",
    Period_ID: "",
    Is_Active: "1",
  });

  const [advForm, setAdvForm] = useState({
    EmployeeID: "",
    Amount: "",
    Description: "",
    Advance_Date: "",
    Created_by: 1,
  });

  // ── Derive selected type from dedForm.DeductionType_ID ──────────────────
  const selectedAddType = types.find(
    (t) => String(t.DeductionType_ID) === dedForm.DeductionType_ID,
  );
  const addTypeIsVariable = selectedAddType?.Category === "VARIABLE";

  // ── Derive category from selectedDed (edit dialog) ───────────────────────
  const editTypeIsVariable = selectedDed?.Category === "VARIABLE";

  // ────────────────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      const [tr, dr, ar, er, mr, pr] = await Promise.all([
        deductionApi.getTypes(),
        deductionApi.getAll(),
        deductionApi.getAdvances(),
        employeeApi.getAll(),
        allowanceApi.getPaymentMethods(),
        periodApi.getAll(),
      ]);
      setTypes(tr.data?.Data || []);
      setDeductions(dr.data?.Data || []);
      setAdvances(ar.data?.Data || []);
      setEmployees(er.data?.Data || []);
      setPaymentMethods(mr.data?.Data || []);
      setPeriods(pr.data?.Data || []);
    } catch {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveType = async () => {
    setSaving(true);
    try {
      const payload = { ...typeForm, Is_Active: parseInt(typeForm.Is_Active) };
      if (modal === "editType" && selected) {
        await deductionApi.updateType(selected.DeductionType_ID, payload);
        toast.success("Updated");
      } else {
        await deductionApi.createType(payload);
        toast.success("Created");
      }
      setModal(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setSaving(false);
  };

  const saveDed = async () => {
    setSaving(true);
    try {
      await deductionApi.create({
        ...dedForm,
        EmployeeID: parseInt(dedForm.EmployeeID),
        DeductionType_ID: parseInt(dedForm.DeductionType_ID),
        Method_ID: dedForm.Method_ID ? parseInt(dedForm.Method_ID) : null,
        // Send Period_ID only when type is VARIABLE
        Period_ID:
          addTypeIsVariable && dedForm.Period_ID
            ? parseInt(dedForm.Period_ID)
            : null,
        Value: parseFloat(dedForm.Value),
      });
      toast.success("Deduction added");
      setModal(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setSaving(false);
  };

  const saveEditDed = async () => {
    if (!selectedDed) return;
    setSaving(true);
    try {
      await deductionApi.update(selectedDed.D_ID, {
        Method_ID: editDedForm.Method_ID
          ? parseInt(editDedForm.Method_ID)
          : null,
        Value: parseFloat(editDedForm.Value),
        // Send Period_ID only when type is VARIABLE
        Period_ID:
          editTypeIsVariable && editDedForm.Period_ID
            ? parseInt(editDedForm.Period_ID)
            : null,
        Is_Active: parseInt(editDedForm.Is_Active),
      });
      toast.success("Deduction updated");
      setEditDedModal(false);
      setSelectedDed(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setSaving(false);
  };

  const saveAdvance = async () => {
    setSaving(true);
    try {
      await deductionApi.createAdvance({
        ...advForm,
        EmployeeID: parseInt(advForm.EmployeeID),
        Amount: parseFloat(advForm.Amount),
      });
      toast.success("Advance recorded");
      setModal(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setSaving(false);
  };

  const settle = async (id: number) => {
    if (!confirm("Mark this advance as settled?")) return;
    try {
      await deductionApi.settleAdvance(id);
      toast.success("Advance settled");
      load();
    } catch {
      toast.error("Failed to settle");
    }
  };

  const catVariant = (c: string): any =>
    c === "STATUTORY" ? "destructive" : c === "FIXED" ? "default" : "purple";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Deductions
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage deduction types, employee deductions and advances
          </p>
        </div>
      </div>

      <Tabs defaultValue="types">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="deductions">Employee Deductions</TabsTrigger>
            <TabsTrigger value="advances">Advances</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTypeForm({
                  Type_Name: "",
                  Category: "FIXED",
                  Description: "",
                  Is_Active: "1",
                });
                setModal("type");
              }}
            >
              <Plus className="w-4 h-4" /> Add Type
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDedForm({
                  EmployeeID: "",
                  DeductionType_ID: "",
                  Method_ID: "",
                  Value: "",
                  Period_ID: "",
                  Is_Active: 1,
                  Created_by: 1,
                });
                setModal("deduction");
              }}
            >
              <Plus className="w-4 h-4" /> Add Deduction
            </Button>
            <Button
              onClick={() => {
                setAdvForm({
                  EmployeeID: "",
                  Amount: "",
                  Description: "",
                  Advance_Date: "",
                  Created_by: 1,
                });
                setModal("advance");
              }}
            >
              <Plus className="w-4 h-4" /> Record Advance
            </Button>
          </div>
        </div>

        {/* ── TYPES TAB ── */}
        <TabsContent value="types">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Deduction Types</CardTitle>
            </CardHeader>
            <Separator className="mt-4" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((t) => (
                  <TableRow key={t.DeductionType_ID}>
                    <TableCell className="font-semibold text-sm">
                      {t.Type_Name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={catVariant(t.Category)}>
                        {t.Category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {t.Description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.Is_Active ? "success" : "destructive"}>
                        {t.Is_Active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelected(t);
                            setTypeForm({
                              Type_Name: t.Type_Name,
                              Category: t.Category,
                              Description: t.Description || "",
                              Is_Active: String(t.Is_Active),
                            });
                            setModal("editType");
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={async () => {
                            if (confirm("Deactivate?")) {
                              await deductionApi.deleteType(t.DeductionType_ID);
                              load();
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {types.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-slate-400"
                    >
                      No deduction types defined
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── DEDUCTIONS TAB ── */}
        <TabsContent value="deductions">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Employee Deductions</CardTitle>
            </CardHeader>
            <Separator className="mt-4" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Value (LKR)</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deductions.map((d) => (
                  <TableRow key={d.D_ID}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7 rounded-lg">
                          <AvatarFallback className="rounded-lg text-[10px]">
                            {d.EmployeeName?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {d.EmployeeName}
                          </p>
                          <p className="text-xs text-slate-400">{d.EPF_No}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {d.DeductionTypeName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={catVariant(d.Category)}>
                        {d.Category}
                      </Badge>
                    </TableCell>
                    {/* Period only meaningful for VARIABLE */}
                    <TableCell className="text-sm text-slate-500">
                      {d.Category === "VARIABLE" ? (
                        d.PeriodName || "—"
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-red-500">
                        -{" "}
                        {Number(d.Value).toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {d.PaymentMethodName || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.Is_Active ? "success" : "destructive"}>
                        {d.Is_Active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedDed(d);
                            setEditDedForm({
                              Method_ID: d.Method_ID ? String(d.Method_ID) : "",
                              Value: String(d.Value),
                              Period_ID: d.Period_ID ? String(d.Period_ID) : "",
                              Is_Active: String(d.Is_Active),
                            });
                            setEditDedModal(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={async () => {
                            if (confirm("Deactivate?")) {
                              await deductionApi.delete(d.D_ID);
                              load();
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {deductions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-slate-400"
                    >
                      No employee deductions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── ADVANCES TAB ── */}
        <TabsContent value="advances">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Employee Advances</CardTitle>
            </CardHeader>
            <Separator className="mt-4" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Advance Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.map((a) => (
                  <TableRow key={a.Advance_ID}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7 rounded-lg">
                          <AvatarFallback className="rounded-lg text-[10px]">
                            {a.EmployeeName?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {a.EmployeeName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {a.Description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {fmt(a.Amount)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-bold ${
                          a.Balance > 0 ? "text-red-500" : "text-emerald-600"
                        }`}
                      >
                        {fmt(a.Balance || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(a.Advance_Date).toLocaleDateString("en-LK")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.Is_Settled ? "success" : "warning"}>
                        {a.Is_Settled ? "Settled" : "Outstanding"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {!a.Is_Settled && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => settle(a.Advance_ID)}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Settle
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {advances.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-slate-400"
                    >
                      No advances recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── TYPE DIALOG ── */}
      <Dialog
        open={modal === "type" || modal === "editType"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal === "editType" ? "Edit" : "Create"} Deduction Type
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={typeForm.Type_Name}
                onChange={(e) =>
                  setTypeForm((p) => ({ ...p, Type_Name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={typeForm.Category}
                onValueChange={(v) =>
                  setTypeForm((p) => ({ ...p, Category: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixed</SelectItem>
                  <SelectItem value="VARIABLE">Variable</SelectItem>
                  <SelectItem value="STATUTORY">Statutory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={typeForm.Description}
                onChange={(e) =>
                  setTypeForm((p) => ({ ...p, Description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={saveType} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADD DEDUCTION DIALOG ── */}
      <Dialog
        open={modal === "deduction"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee Deduction</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {/* Employee — full width */}
            <div className="col-span-2 space-y-1.5">
              <Label>Employee</Label>
              <Select
                value={dedForm.EmployeeID}
                onValueChange={(v) =>
                  setDedForm((p) => ({ ...p, EmployeeID: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px]">
                  {employees.map((e) => (
                    <SelectItem key={e.EmployeeID} value={String(e.EmployeeID)}>
                      {e.FullName} ({e.EPF_No})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deduction Type — full width, clears Period_ID on change */}
            <div className="col-span-2 space-y-1.5">
              <Label>Deduction Type</Label>
              <Select
                value={dedForm.DeductionType_ID}
                onValueChange={(v) =>
                  setDedForm((p) => ({
                    ...p,
                    DeductionType_ID: v,
                    Period_ID: "", // clear when type changes
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {types
                    .filter((t) => t.Is_Active)
                    .map((t) => (
                      <SelectItem
                        key={t.DeductionType_ID}
                        value={String(t.DeductionType_ID)}
                      >
                        {t.Type_Name}&nbsp;
                        <span className="text-xs text-slate-400">
                          ({t.Category})
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Category hint beneath the dropdown */}
              {selectedAddType && (
                <div className="flex items-center gap-2 pt-0.5">
                  <Badge
                    variant={catVariant(selectedAddType.Category)}
                    className="text-xs"
                  >
                    {selectedAddType.Category}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {addTypeIsVariable
                      ? "Payroll period is required for this type"
                      : "No payroll period needed"}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method — full width */}
            <div className="col-span-2 space-y-1.5">
              <Label>Payment Method</Label>
              <Select
                value={dedForm.Method_ID}
                onValueChange={(v) =>
                  setDedForm((p) => ({ ...p, Method_ID: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.Method_ID} value={String(m.Method_ID)}>
                      {m.Method_Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value */}
            <div
              className={
                addTypeIsVariable ? "space-y-1.5" : "col-span-2 space-y-1.5"
              }
            >
              <Label>Value (LKR)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={dedForm.Value}
                onChange={(e) =>
                  setDedForm((p) => ({ ...p, Value: e.target.value }))
                }
              />
            </div>

            {/* Payroll Period — only shown when VARIABLE */}
            {addTypeIsVariable && (
              <div className="space-y-1.5">
                <Label>Payroll Period</Label>
                <Select
                  value={dedForm.Period_ID}
                  onValueChange={(v) =>
                    setDedForm((p) => ({ ...p, Period_ID: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period..." />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[300px]">
                    {periods.map((p) => (
                      <SelectItem key={p.Period_ID} value={String(p.Period_ID)}>
                        {p.Period_Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={saveDed} disabled={saving}>
              {saving ? "Saving..." : "Add Deduction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DEDUCTION DIALOG ── */}
      <Dialog
        open={editDedModal}
        onOpenChange={(o) => {
          if (!o) {
            setEditDedModal(false);
            setSelectedDed(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deduction</DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-1">
              <span>{selectedDed?.EmployeeName}</span>
              <span className="text-slate-300">—</span>
              <span>{selectedDed?.DeductionTypeName}</span>
              {selectedDed?.Category && (
                <Badge
                  variant={catVariant(selectedDed.Category)}
                  className="text-xs"
                >
                  {selectedDed.Category}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {/* Value */}
            <div className="space-y-1.5">
              <Label>Value (LKR)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={editDedForm.Value}
                onChange={(e) =>
                  setEditDedForm((p) => ({ ...p, Value: e.target.value }))
                }
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={editDedForm.Is_Active}
                onValueChange={(v) =>
                  setEditDedForm((p) => ({ ...p, Is_Active: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method — full width */}
            <div className="col-span-2 space-y-1.5">
              <Label>Payment Method</Label>
              <Select
                value={editDedForm.Method_ID}
                onValueChange={(v) =>
                  setEditDedForm((p) => ({ ...p, Method_ID: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.Method_ID} value={String(m.Method_ID)}>
                      {m.Method_Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payroll Period — only shown when type is VARIABLE */}
            {editTypeIsVariable && (
              <div className="col-span-2 space-y-1.5">
                <Label>Payroll Period</Label>
                <Select
                  value={editDedForm.Period_ID}
                  onValueChange={(v) =>
                    setEditDedForm((p) => ({ ...p, Period_ID: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period..." />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[300px]">
                    {periods.map((p) => (
                      <SelectItem key={p.Period_ID} value={String(p.Period_ID)}>
                        {p.Period_Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDedModal(false);
                setSelectedDed(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEditDed} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADVANCE DIALOG ── */}
      <Dialog
        open={modal === "advance"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Employee Advance</DialogTitle>
            <DialogDescription>
              Record a salary advance for an employee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select
                value={advForm.EmployeeID}
                onValueChange={(v) =>
                  setAdvForm((p) => ({ ...p, EmployeeID: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px]">
                  {employees.map((e) => (
                    <SelectItem key={e.EmployeeID} value={String(e.EmployeeID)}>
                      {e.FullName} ({e.EPF_No})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (LKR)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={advForm.Amount}
                onChange={(e) =>
                  setAdvForm((p) => ({ ...p, Amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description / Reason</Label>
              <Input
                value={advForm.Description}
                onChange={(e) =>
                  setAdvForm((p) => ({ ...p, Description: e.target.value }))
                }
                placeholder="Reason for advance..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Advance Date</Label>
              <Input
                type="date"
                value={advForm.Advance_Date}
                onChange={(e) =>
                  setAdvForm((p) => ({ ...p, Advance_Date: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={saveAdvance} disabled={saving}>
              {saving ? "Saving..." : "Record Advance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
