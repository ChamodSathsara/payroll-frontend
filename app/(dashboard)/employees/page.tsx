'use client';
import { useEffect, useState } from 'react';
import { employeeApi, departmentApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Eye, X, Users } from 'lucide-react';
import { fmt } from '@/lib/utils';

const EMPTY_FORM = {
  EPF_No: '', FirstName: '', LastName: '', FullName: '', NameWithInitials: '',
  NIC: '', Designation_ID: '', Department_ID: '', BasicSalary: '',
  EPF_Eligible: '1', DateOfBirth: '', JoinDate: '', Address: '', ContactNo: '',
  BankDetail: { BankAccount_No: '', Bank_Name: '', Branch_Name: '', Branch_Code: '', Is_Primary: 1 }
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const f = (field: string, val: string) => setForm((p: any) => ({ ...p, [field]: val }));

  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModalType('create'); };
  const openEdit = (emp: any) => {
    setForm({ ...emp, Designation_ID: String(emp.Designation_ID || ''), Department_ID: String(emp.Department_ID || ''), EPF_Eligible: String(emp.EPF_Eligible ?? 1) });
    setSelected(emp); setModalType('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        BasicSalary: parseFloat(form.BasicSalary) || 0,
        EPF_Eligible: parseInt(form.EPF_Eligible),
        Designation_ID: form.Designation_ID ? parseInt(form.Designation_ID) : null,
        Department_ID: form.Department_ID ? parseInt(form.Department_ID) : null,
      };
      if (!payload.BankDetail?.BankAccount_No) delete payload.BankDetail;
      if (modalType === 'create') {
        await employeeApi.create(payload);
        toast.success('Employee created successfully');
      } else {
        await employeeApi.update(selected.EmployeeID, payload);
        toast.success('Employee updated successfully');
      }
      setModalType(null); load();
    } catch (e: any) { toast.error(e?.response?.data?.Message || 'Error saving employee'); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this employee?')) return;
    try { await employeeApi.delete(id); toast.success('Employee deactivated'); load(); }
    catch { toast.error('Failed to deactivate'); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Employees</h1>
          <p className="text-slate-500 mt-1 text-sm">{employees.length} total employees in the system</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Employee</Button>
      </div>

      {/* Search */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search by name, EPF No, NIC, contact..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(search)} />
            </div>
            <Button onClick={() => load(search)}>Search</Button>
            <Button variant="outline" onClick={() => { setSearch(''); load(''); }}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Employee Directory</CardTitle>
        </CardHeader>
        <Separator className="mt-4" />
        {loading ? (
          <CardContent className="py-16 text-center text-slate-400 text-sm">Loading employees...</CardContent>
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
              {employees.map(emp => (
                <TableRow key={emp.EmployeeID}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-[10px]">{emp.FullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{emp.FullName}</p>
                        <p className="text-xs text-slate-400">{emp.NIC || emp.ContactNo || '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md">{emp.EPF_No}</span></TableCell>
                  <TableCell className="text-sm text-slate-600">{emp.DepartmentName || '—'}</TableCell>
                  <TableCell className="text-sm text-slate-600">{emp.DesignationName || '—'}</TableCell>
                  <TableCell className="text-sm font-semibold text-slate-800">{fmt(emp.BasicSalary)}</TableCell>
                  <TableCell><Badge variant={emp.EPF_Eligible ? 'success' : 'secondary'}>{emp.EPF_Eligible ? 'Yes' : 'No'}</Badge></TableCell>
                  <TableCell><Badge variant={emp.Status === 1 ? 'success' : 'destructive'}>{emp.Status === 1 ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Button variant="ghost" size="icon-sm" onClick={() => { setSelected(emp); setModalType('view'); }}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(emp)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="destructive" size="icon-sm" onClick={() => handleDelete(emp.EmployeeID)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">No employees found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={modalType === 'create' || modalType === 'edit'} onOpenChange={open => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalType === 'create' ? 'Add New Employee' : 'Edit Employee'}</DialogTitle>
            <DialogDescription>Fill in the employee details below</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="personal">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="job">Job Details</TabsTrigger>
              {modalType === 'create' && <TabsTrigger value="bank">Bank Details</TabsTrigger>}
            </TabsList>

            <TabsContent value="personal" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>EPF Number</Label><Input value={form.EPF_No} onChange={e => f('EPF_No', e.target.value)} placeholder="EPF001" /></div>
                <div className="space-y-1.5"><Label>NIC</Label><Input value={form.NIC} onChange={e => f('NIC', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>First Name</Label><Input value={form.FirstName} onChange={e => f('FirstName', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Last Name</Label><Input value={form.LastName} onChange={e => f('LastName', e.target.value)} /></div>
                <div className="col-span-2 space-y-1.5"><Label>Full Name</Label><Input value={form.FullName} onChange={e => f('FullName', e.target.value)} /></div>
                <div className="col-span-2 space-y-1.5"><Label>Name With Initials</Label><Input value={form.NameWithInitials} onChange={e => f('NameWithInitials', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.DateOfBirth?.substring(0,10) || ''} onChange={e => f('DateOfBirth', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Contact No</Label><Input value={form.ContactNo} onChange={e => f('ContactNo', e.target.value)} /></div>
                <div className="col-span-2 space-y-1.5"><Label>Address</Label><Input value={form.Address} onChange={e => f('Address', e.target.value)} /></div>
              </div>
            </TabsContent>

            <TabsContent value="job" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={form.Department_ID} onValueChange={v => f('Department_ID', v)}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.Department_ID} value={String(d.Department_ID)}>{d.Department_Name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Designation</Label>
                  <Select value={form.Designation_ID} onValueChange={v => f('Designation_ID', v)}>
                    <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>{designations.map(d => <SelectItem key={d.Designation_ID} value={String(d.Designation_ID)}>{d.Designation_Name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Basic Salary (LKR)</Label><Input type="number" value={form.BasicSalary} onChange={e => f('BasicSalary', e.target.value)} placeholder="0.00" /></div>
                <div className="space-y-1.5">
                  <Label>EPF Eligible</Label>
                  <Select value={String(form.EPF_Eligible)} onValueChange={v => f('EPF_Eligible', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Yes</SelectItem><SelectItem value="0">No</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Join Date</Label><Input type="date" value={form.JoinDate?.substring(0,10) || ''} onChange={e => f('JoinDate', e.target.value)} /></div>
              </div>
            </TabsContent>

            {modalType === 'create' && (
              <TabsContent value="bank" className="space-y-3 mt-4">
                <p className="text-xs text-slate-500">Optional — add primary bank account details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Account Number</Label><Input value={form.BankDetail.BankAccount_No} onChange={e => setForm((p: any) => ({ ...p, BankDetail: { ...p.BankDetail, BankAccount_No: e.target.value } }))} /></div>
                  <div className="space-y-1.5"><Label>Bank Name</Label><Input value={form.BankDetail.Bank_Name} onChange={e => setForm((p: any) => ({ ...p, BankDetail: { ...p.BankDetail, Bank_Name: e.target.value } }))} /></div>
                  <div className="space-y-1.5"><Label>Branch Name</Label><Input value={form.BankDetail.Branch_Name} onChange={e => setForm((p: any) => ({ ...p, BankDetail: { ...p.BankDetail, Branch_Name: e.target.value } }))} /></div>
                  <div className="space-y-1.5"><Label>Branch Code</Label><Input value={form.BankDetail.Branch_Code} onChange={e => setForm((p: any) => ({ ...p, BankDetail: { ...p.BankDetail, Branch_Code: e.target.value } }))} /></div>
                </div>
              </TabsContent>
            )}
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : modalType === 'create' ? 'Create Employee' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={modalType === 'view'} onOpenChange={open => !open && setModalType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Avatar className="w-14 h-14 rounded-xl">
                  <AvatarFallback className="rounded-xl text-lg">{selected.FullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900 text-base">{selected.FullName}</p>
                  <p className="text-sm text-slate-500">{selected.DesignationName} • {selected.DepartmentName}</p>
                  <Badge className="mt-1" variant={selected.Status === 1 ? 'success' : 'destructive'}>{selected.Status === 1 ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  ['EPF Number', selected.EPF_No], ['NIC', selected.NIC || '—'],
                  ['Contact', selected.ContactNo || '—'], ['Basic Salary', fmt(selected.BasicSalary)],
                  ['EPF Eligible', selected.EPF_Eligible ? 'Yes' : 'No'],
                  ['Join Date', selected.JoinDate ? new Date(selected.JoinDate).toLocaleDateString('en-LK') : '—'],
                  ['Address', selected.Address || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
              {selected.BankDetails?.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Primary Bank</p>
                  <p className="text-sm text-slate-700">{selected.BankDetails[0].Bank_Name} — {selected.BankDetails[0].BankAccount_No}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
