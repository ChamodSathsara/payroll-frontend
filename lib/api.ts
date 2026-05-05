import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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

// ─── Helper to trigger file download from blob response ───────────────────────
export const downloadFile = (blobData: Blob, filename: string) => {
  const url = URL.createObjectURL(blobData);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const reportApi = {
  // ── Legacy endpoints (kept for compatibility) ──────────────────────────────
  payrollSummary: (periodId: number) =>
    api.get(`/reports/payroll-summary/${periodId}`),
  epfReport: (periodId: number) =>
    api.get(`/reports/epf/${periodId}`),
  bankTransfer: (periodId: number) =>
    api.get(`/reports/bank-transfer/${periodId}`),
  employeeHistory: (empId: number) =>
    api.get(`/reports/employee-history/${empId}`),
  payeReport: (periodId: number) =>
    api.get(`/reports/paye/${periodId}`),

  // ── Report 1: Department-Wise Salary ──────────────────────────────────────
  departmentWiseSalary: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/department-wise-salary', { params: { companyId, periodId, departmentId } }),
  departmentWiseSalaryExcel: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/department-wise-salary/excel', {
      params: { companyId, periodId, departmentId },
      responseType: 'blob',
    }),
  departmentWiseSalaryPdf: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/department-wise-salary/pdf', {
      params: { companyId, periodId, departmentId },
      responseType: 'blob',
    }),

  // ── Report 2: Department Salary Summary ───────────────────────────────────
  departmentSalarySummary: (companyId: number, periodId: number) =>
    api.get('/reports/department-salary-summary', { params: { companyId, periodId } }),
  departmentSalarySummaryExcel: (companyId: number, periodId: number) =>
    api.get('/reports/department-salary-summary/excel', {
      params: { companyId, periodId },
      responseType: 'blob',
    }),
  departmentSalarySummaryPdf: (companyId: number, periodId: number) =>
    api.get('/reports/department-salary-summary/pdf', {
      params: { companyId, periodId },
      responseType: 'blob',
    }),

  // ── Report 3.1: EPF Contributions ─────────────────────────────────────────
  epfContributions: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/epf-contributions', { params: { companyId, periodId, departmentId } }),
  epfContributionsExcel: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/epf-contributions/excel', {
      params: { companyId, periodId, departmentId },
      responseType: 'blob',
    }),
  epfContributionsPdf: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/epf-contributions/pdf', {
      params: { companyId, periodId, departmentId },
      responseType: 'blob',
    }),

  // ── Report 3.2: ETF Contributions ─────────────────────────────────────────
  etfContributions: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/etf-contributions', { params: { companyId, periodId, departmentId } }),
  etfContributionsExcel: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/etf-contributions/excel', {
      params: { companyId, periodId, departmentId },
      responseType: 'blob',
    }),
  etfContributionsPdf: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/etf-contributions/pdf', {
      params: { companyId, periodId, departmentId },
      responseType: 'blob',
    }),

  // ── Report 3.3: MSPS Contributions ────────────────────────────────────────
  mspsContributions: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/msps-contributions', { params: { companyId, periodId, departmentId } }),
  mspsContributionsExcel: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/msps-contributions/excel', {
      params: { companyId, periodId, departmentId },
      responseType: 'blob',
    }),
  mspsContributionsPdf: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/msps-contributions/pdf', {
      params: { companyId, periodId, departmentId },
      responseType: 'blob',
    }),

  // ── Report 4: Monthly Department Cost (year-based pivot) ──────────────────
  monthlyDepartmentCost: (companyId: number, year: number) =>
    api.get('/reports/monthly-department-cost', { params: { companyId, year } }),
  monthlyDepartmentCostExcel: (companyId: number, year: number) =>
    api.get('/reports/monthly-department-cost/excel', {
      params: { companyId, year },
      responseType: 'blob',
    }),
  monthlyDepartmentCostPdf: (companyId: number, year: number) =>
    api.get('/reports/monthly-department-cost/pdf', {
      params: { companyId, year },
      responseType: 'blob',
    }),

  // ── Report 5: PAYE Tax ────────────────────────────────────────────────────
  payeTax: (companyId: number, periodId: number) =>
    api.get('/reports/paye-tax', { params: { companyId, periodId } }),
  payeTaxExcel: (companyId: number, periodId: number) =>
    api.get('/reports/paye-tax/excel', {
      params: { companyId, periodId },
      responseType: 'blob',
    }),
  payeTaxPdf: (companyId: number, periodId: number) =>
    api.get('/reports/paye-tax/pdf', {
      params: { companyId, periodId },
      responseType: 'blob',
    }),

  // ── Report 6: Payroll Full Detailed (PDF only) ────────────────────────────
  payrollFullDetailed: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/payroll-full-detailed', { params: { companyId, periodId, departmentId } }),
  payrollFullDetailedPdf: (companyId: number, periodId: number, departmentId?: number) =>
    api.get('/reports/payroll-full-detailed/pdf', {
      params: { companyId, periodId, departmentId },
      responseType: 'blob',
    }),

  // ── Report 7: Payroll Summary Report ──────────────────────────────────────
  payrollSummaryReport: (periodId: number, companyId?: number) =>
    api.get('/reports/payroll-summary-report', { params: { companyId, periodId } }),
  payrollSummaryReportExcel: (periodId: number, companyId?: number) =>
    api.get('/reports/payroll-summary-report/excel', {
      params: { companyId, periodId },
      responseType: 'blob',
    }),
  payrollSummaryReportPdf: (periodId: number, companyId?: number) =>
    api.get('/reports/payroll-summary-report/pdf', {
      params: { companyId, periodId },
      responseType: 'blob',
    }),
};

export default api;