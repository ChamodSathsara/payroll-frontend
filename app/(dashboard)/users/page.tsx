'use client';
import { useEffect, useState } from 'react';
import { userApi, departmentApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Search, Shield, Eye, EyeOff } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [userTypes, setUserTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ User_Name: '', Password: '', Email: '', Contact_No: '', UserType_ID: '', Department_ID: '', Is_Active: '1' });

  const load = async (q?: string) => {
    try {
      const [ur, utr, dr] = await Promise.all([userApi.getAll(q || undefined), userApi.getUserTypes(), departmentApi.getAll()]);
      setUsers(ur.data?.Data || []);
      setUserTypes(utr.data?.Data || []);
      setDepartments(dr.data?.Data || []);
    } catch { toast.error('Failed to load users'); }
  };

  useEffect(() => { load(); }, []);

  const f = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        UserType_ID: parseInt(form.UserType_ID),
        Department_ID: form.Department_ID ? parseInt(form.Department_ID) : null,
        Is_Active: parseInt(form.Is_Active),
      };
      if (modal === 'create') { await userApi.create(payload); toast.success('User created'); }
      else { await userApi.update(selected.User_ID, payload); toast.success('User updated'); }
      setModal(null); load();
    } catch (e: any) { toast.error(e?.response?.data?.Message || 'Error saving user'); }
    setSaving(false);
  };

  const del = async (id: number) => {
    if (!confirm('Deactivate this user?')) return;
    try { await userApi.delete(id); toast.success('User deactivated'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1 text-sm">{users.length} system users</p>
        </div>
        <Button onClick={() => { setForm({ User_Name: '', Password: '', Email: '', Contact_No: '', UserType_ID: '', Department_ID: '', Is_Active: '1' }); setSelected(null); setModal('create'); }}><Plus className="w-4 h-4" /> Add User</Button>
      </div>

      {/* Search */}
      <Card className="border-slate-200 shadow-none">
        <div className="p-4 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-9" placeholder="Search by username or email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(search)} />
          </div>
          <Button onClick={() => load(search)}>Search</Button>
          <Button variant="outline" onClick={() => { setSearch(''); load(''); }}>Clear</Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">System Users</CardTitle>
          <CardDescription>Manage who has access to the payroll system</CardDescription>
        </CardHeader>
        <Separator className="mt-4" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.User_ID}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-8 h-8 rounded-lg">
                      <AvatarFallback className="rounded-lg text-[10px]">{u.User_Name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{u.User_Name}</p>
                      <p className="text-xs text-slate-400">{u.Contact_No || 'No contact'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{u.Email || '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-sm font-semibold text-indigo-600">{u.UserTypeName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{u.DepartmentName || '—'}</TableCell>
                <TableCell><Badge variant={u.Is_Active ? 'success' : 'destructive'}>{u.Is_Active ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Button variant="ghost" size="icon-sm" onClick={() => { setSelected(u); setForm({ User_Name: u.User_Name, Password: '', Email: u.Email || '', Contact_No: u.Contact_No || '', UserType_ID: String(u.UserType_ID), Department_ID: String(u.Department_ID || ''), Is_Active: String(u.Is_Active) }); setModal('edit'); }}><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="destructive" size="icon-sm" onClick={() => del(u.User_ID)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">No users found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={modal === 'create' || modal === 'edit'} onOpenChange={o => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal === 'create' ? 'Create New User' : 'Edit User'}</DialogTitle>
            <DialogDescription>Manage system access credentials and role assignment</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={form.User_Name} onChange={e => f('User_Name', e.target.value)} disabled={modal === 'edit'} placeholder="username" />
            </div>
            <div className="space-y-1.5">
              <Label>Password {modal === 'edit' && <span className="text-slate-400 normal-case">(leave blank to keep)</span>}</Label>
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} value={form.Password} onChange={e => f('Password', e.target.value)} placeholder="••••••••" className="pr-9" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Email</Label><Input type="email" value={form.Email} onChange={e => f('Email', e.target.value)} placeholder="user@company.com" /></div>
            <div className="space-y-1.5"><Label>Contact No</Label><Input value={form.Contact_No} onChange={e => f('Contact_No', e.target.value)} placeholder="+94 77 000 0000" /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.Is_Active} onValueChange={v => f('Is_Active', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Active</SelectItem><SelectItem value="0">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.UserType_ID} onValueChange={v => f('UserType_ID', v)}>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>{userTypes.map(ut => <SelectItem key={ut.UserType_ID} value={String(ut.UserType_ID)}>{ut.Description}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.Department_ID} onValueChange={v => f('Department_ID', v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{departments.map(d => <SelectItem key={d.Department_ID} value={String(d.Department_ID)}>{d.Department_Name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : modal === 'create' ? 'Create User' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
