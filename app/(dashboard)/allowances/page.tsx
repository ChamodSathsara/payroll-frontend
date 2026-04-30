"use client";
import { useEffect, useState } from "react";
import { allowanceApi, employeeApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Card,
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { fmt } from "@/lib/utils";

export default function AllowancesPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [modal, setModal] = useState<"type" | "editType" | "allowance" | null>(
    null,
  );
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [typeForm, setTypeForm] = useState({
    Type_Name: "",
    Category: "FIXED",
    Description: "",
    Is_Active: "1",
  });
  const [allowForm, setAllowForm] = useState({
    EmployeeID: "",
    AllowanceType_ID: "",
    Method_ID: "",
    Value: "",
    Start_Date: "",
    End_Date: "",
    Is_Active: 1,
    Created_by: 1,
  });

  const load = async () => {
    try {
      const [tr, ar, er, mr] = await Promise.all([
        allowanceApi.getTypes(),
        allowanceApi.getAll(),
        employeeApi.getAll(),
        allowanceApi.getPaymentMethods(),
      ]);
      setTypes(tr.data?.Data || []);
      setAllowances(ar.data?.Data || []);
      setEmployees(er.data?.Data || []);
      setPaymentMethods(mr.data?.Data || []);
    } catch {
      toast.error("Failed to load allowances");
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
        await allowanceApi.updateType(selected.AllowanceType_ID, payload);
        toast.success("Updated");
      } else {
        await allowanceApi.createType(payload);
        toast.success("Allowance type created");
      }
      setModal(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setSaving(false);
  };

  const deleteType = async (id: number) => {
    if (!confirm("Deactivate this allowance type?")) return;
    try {
      await allowanceApi.deleteType(id);
      toast.success("Deactivated");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  const saveAllowance = async () => {
    setSaving(true);
    try {
      await allowanceApi.create({
        ...allowForm,
        EmployeeID: parseInt(allowForm.EmployeeID),
        AllowanceType_ID: parseInt(allowForm.AllowanceType_ID),
        Method_ID: allowForm.Method_ID ? parseInt(allowForm.Method_ID) : null,
        Value: parseFloat(allowForm.Value),
      });
      toast.success("Allowance added");
      setModal(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.Message || "Error");
    }
    setSaving(false);
  };

  const deleteAllowance = async (id: number) => {
    if (!confirm("Deactivate this allowance?")) return;
    try {
      await allowanceApi.delete(id);
      toast.success("Deactivated");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  const catVariant = (c: string) => (c === "FIXED" ? "default" : "purple");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Allowances
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage allowance types and employee allowances
          </p>
        </div>
      </div>

      <Tabs defaultValue="types">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="types">Allowance Types</TabsTrigger>
            <TabsTrigger value="employee">Employee Allowances</TabsTrigger>
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
              onClick={() => {
                setAllowForm({
                  EmployeeID: "",
                  AllowanceType_ID: "",
                  Method_ID: "",
                  Value: "",
                  Start_Date: "",
                  End_Date: "",
                  Is_Active: 1,
                  Created_by: 1,
                });
                setModal("allowance");
              }}
            >
              <Plus className="w-4 h-4" /> Add Allowance
            </Button>
          </div>
        </div>

        <TabsContent value="types">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Allowance Types</CardTitle>
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
                  <TableRow key={t.AllowanceType_ID}>
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
                          onClick={() => deleteType(t.AllowanceType_ID)}
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
                      No allowance types defined
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="employee">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Employee Allowances</CardTitle>
            </CardHeader>
            <Separator className="mt-4" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Allowance Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Value (LKR)</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowances.map((a) => (
                  <TableRow key={a.FE_ID}>
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
                          <p className="text-xs text-slate-400">{a.EPF_No}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {a.AllowanceTypeName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={catVariant(a.Category)}>
                        {a.Category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-emerald-600">
                        +{" "}
                        {Number(a.Value).toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {a.PaymentMethodName || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.Is_Active ? "success" : "destructive"}>
                        {a.Is_Active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => deleteAllowance(a.FE_ID)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {allowances.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-slate-400"
                    >
                      No employee allowances configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Type Dialog */}
      <Dialog
        open={modal === "type" || modal === "editType"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal === "editType" ? "Edit" : "Create"} Allowance Type
            </DialogTitle>
            <DialogDescription>
              Define a reusable allowance category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={typeForm.Type_Name}
                onChange={(e) =>
                  setTypeForm((p) => ({ ...p, Type_Name: e.target.value }))
                }
                placeholder="e.g. Transport Allowance"
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
                placeholder="Brief description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={saveType} disabled={saving}>
              {saving ? "Saving..." : "Save Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allowance Dialog */}
      <Dialog
        open={modal === "allowance"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee Allowance</DialogTitle>
            <DialogDescription>
              Assign an allowance to an employee
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Employee</Label>
              <Select
                value={allowForm.EmployeeID}
                onValueChange={(v) =>
                  setAllowForm((p) => ({ ...p, EmployeeID: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="max-h-[200px] overflow-y-auto"
                >
                  {employees.map((e) => (
                    <SelectItem key={e.EmployeeID} value={String(e.EmployeeID)}>
                      {e.FullName} ({e.EPF_No})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Allowance Type</Label>
              <Select
                value={allowForm.AllowanceType_ID}
                onValueChange={(v) =>
                  setAllowForm((p) => ({ ...p, AllowanceType_ID: v }))
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
                        key={t.AllowanceType_ID}
                        value={String(t.AllowanceType_ID)}
                      >
                        {t.Type_Name} ({t.Category})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select
                value={allowForm.Method_ID}
                onValueChange={(v) =>
                  setAllowForm((p) => ({ ...p, Method_ID: v }))
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
            <div className="space-y-1.5">
              <Label>Value (LKR)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={allowForm.Value}
                onChange={(e) =>
                  setAllowForm((p) => ({ ...p, Value: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={allowForm.Start_Date}
                onChange={(e) =>
                  setAllowForm((p) => ({ ...p, Start_Date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={allowForm.End_Date}
                onChange={(e) =>
                  setAllowForm((p) => ({ ...p, End_Date: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={saveAllowance} disabled={saving}>
              {saving ? "Saving..." : "Add Allowance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
