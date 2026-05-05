import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  login: (data: { UserName: string; Password: string }) => api.post('/Auth/login', data),
};

export const employeeApi = {
  getAll: (search?: string) => api.get('/Employee', { params: { search } }),
  getById: (id: number) => api.get(`/Employee/${id}`),
  create: (data: any) => api.post('/Employee', data),
  update: (id: number, data: any) => api.put(`/Employee/${id}`, data),
  delete: (id: number) => api.delete(`/Employee/${id}`),
};

export const departmentApi = {
  getAll: () => api.get('/Department'),
  create: (data: any) => api.post('/Department', data),
  update: (id: number, data: any) => api.put(`/Department/${id}`, data),
  delete: (id: number) => api.delete(`/Department/${id}`),
  getDesignations: () => api.get('/Department/designations'),
  createDesignation: (data: any) => api.post('/Department/designations', data),
};

export const userApi = {
  getAll: (search?: string) => api.get('/User', { params: { search } }),
  getById: (id: number) => api.get(`/User/${id}`),
  create: (data: any) => api.post('/User', data),
  update: (id: number, data: any) => api.put(`/User/${id}`, data),
  delete: (id: number) => api.delete(`/User/${id}`),
  getUserTypes: () => api.get('/User/types'),
  createUserType: (data: any) => api.post('/User/types', data),
};

export const allowanceApi = {
  getTypes: () => api.get('/Allowance/types'),
  createType: (data: any) => api.post('/Allowance/types', data),
  updateType: (id: number, data: any) => api.put(`/Allowance/types/${id}`, data),
  deleteType: (id: number) => api.delete(`/Allowance/types/${id}`),
  getAll: () => api.get('/Allowance'),
  getByEmployee: (empId: number) => api.get(`/Allowance/employee/${empId}`),
  create: (data: any) => api.post('/Allowance', data),
  update: (id: number, data: any) => api.put(`/Allowance/${id}`, data),
  delete: (id: number) => api.delete(`/Allowance/${id}`),
  getPaymentMethods: () => api.get('/Allowance/payment-methods'),
};

export const deductionApi = {
  getTypes: () => api.get('/Deduction/types'),
  createType: (data: any) => api.post('/Deduction/types', data),
  updateType: (id: number, data: any) => api.put(`/Deduction/types/${id}`, data),
  deleteType: (id: number) => api.delete(`/Deduction/types/${id}`),
  getAll: () => api.get('/Deduction'),
  getByEmployee: (empId: number) => api.get(`/Deduction/employee/${empId}`),
  create: (data: any) => api.post('/Deduction', data),
  update: (id: number, data: any) => api.put(`/Deduction/${id}`, data),
  delete: (id: number) => api.delete(`/Deduction/${id}`),
  getAdvances: (empId?: number) => api.get('/Deduction/advances', { params: { employeeId: empId } }),
  createAdvance: (data: any) => api.post('/Deduction/advances', data),
  settleAdvance: (id: number) => api.patch(`/Deduction/advances/${id}/settle`),
};

export const periodApi = {
  getAll: () => api.get('/PayrollPeriod'),
  getById: (id: number) => api.get(`/PayrollPeriod/${id}`),
  create: (data: any) => api.post('/PayrollPeriod', data),
  updateStatus: (id: number, data: any) => api.patch(`/PayrollPeriod/${id}/status`, data),
  delete: (id: number) => api.delete(`/PayrollPeriod/${id}`),
};

export const payrollApi = {
  getAll: (periodId?: number, employeeId?: number) => api.get('/Payroll', { params: { periodId, employeeId } }),
  getById: (id: number) => api.get(`/Payroll/${id}`),
  generate: (data: any) => api.post('/Payroll/generate', data),
  generateBulk: (data: any) => api.post('/Payroll/generate/bulk', data),
  updateStatus: (id: number, data: any) => api.patch(`/Payroll/${id}/status`, data),
  delete: (id: number) => api.delete(`/Payroll/${id}`),
  getSummaryReport: (periodId: number) => api.get(`/Payroll/report/${periodId}`),
};

export const salarySlipApi = {
  getAll: () => api.get('/SalarySlip'),
  getById: (id: number) => api.get(`/SalarySlip/${id}`),
  getByEmployee: (empId: number) => api.get(`/SalarySlip/employee/${empId}`),
  generate: (data: any) => api.post('/SalarySlip/generate', data),
  bulkGenerate: (periodId: number, generatedBy: number) =>
    api.post(`/SalarySlip/generate/bulk/${periodId}?generatedBy=${generatedBy}`),
  downloadPdf: (id: number) => api.get(`/SalarySlip/${id}/pdf`, { responseType: 'blob' }),
};

export const reportApi = {
  payrollSummary: (periodId: number) => api.get(`/Report/payroll-summary/${periodId}`),
  epfReport: (periodId: number) => api.get(`/Report/epf/${periodId}`),
  bankTransfer: (periodId: number) => api.get(`/Report/bank-transfer/${periodId}`),
  employeeHistory: (empId: number) => api.get(`/Report/employee-history/${empId}`),
  payeReport: (periodId: number) => api.get(`/Report/paye/${periodId}`),
};

export default api;
