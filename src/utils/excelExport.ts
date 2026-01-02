// Excel Export Utility for Advisor Statistics

interface ExcelRow {
  [key: string]: string | number;
}

const convertToCSV = (data: ExcelRow[], headers: { key: string; label: string }[]): string => {
  const headerRow = headers.map(h => h.label).join(',');
  const dataRows = data.map(row => 
    headers.map(h => {
      const value = row[h.key];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  // Add BOM for proper Arabic support in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface DepartmentStats {
  department: string;
  totalStudents: number;
  avgGpa: number;
  atRiskCount: number;
}

interface GpaDistribution {
  range: string;
  count: number;
}

interface RiskDistribution {
  level: string;
  labelAr: string;
  labelEn: string;
  count: number;
  color: string;
}

interface AdvisorStats {
  totalStudents: number;
  avgGpa: number;
  atRiskStudents: number;
  excellentStudents: number;
  avgCredits: number;
  departmentStats: DepartmentStats[];
  gpaDistribution: GpaDistribution[];
  riskDistribution: RiskDistribution[];
}

export const exportAdvisorStatsToExcel = (stats: AdvisorStats, language: 'ar' | 'en') => {
  const isAr = language === 'ar';
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Summary sheet data
  const summaryData: ExcelRow[] = [
    {
      metric: isAr ? 'إجمالي الطلاب' : 'Total Students',
      value: stats.totalStudents
    },
    {
      metric: isAr ? 'متوسط المعدل' : 'Average GPA',
      value: stats.avgGpa.toFixed(2)
    }
  ];

  const summaryHeaders = [
    { key: 'metric', label: isAr ? 'المقياس' : 'Metric' },
    { key: 'value', label: isAr ? 'القيمة' : 'Value' }
  ];

  // Department stats
  const deptData: ExcelRow[] = stats.departmentStats.map(d => ({
    department: d.department,
    count: d.totalStudents,
    avgGpa: d.avgGpa.toFixed(2),
    atRisk: d.atRiskCount
  }));

  const deptHeaders = [
    { key: 'department', label: isAr ? 'القسم' : 'Department' },
    { key: 'count', label: isAr ? 'عدد الطلاب' : 'Student Count' },
    { key: 'avgGpa', label: isAr ? 'متوسط المعدل' : 'Average GPA' },
    { key: 'atRisk', label: isAr ? 'معرضون للخطر' : 'At Risk' }
  ];

  // GPA Distribution
  const gpaData: ExcelRow[] = stats.gpaDistribution.map(g => ({
    range: g.range,
    count: g.count
  }));

  const gpaHeaders = [
    { key: 'range', label: isAr ? 'نطاق المعدل' : 'GPA Range' },
    { key: 'count', label: isAr ? 'عدد الطلاب' : 'Student Count' }
  ];

  // Risk Distribution
  const riskData: ExcelRow[] = stats.riskDistribution.map(r => ({
    level: isAr ? r.labelAr : r.labelEn,
    count: r.count
  }));

  const riskHeaders = [
    { key: 'level', label: isAr ? 'مستوى الخطر' : 'Risk Level' },
    { key: 'count', label: isAr ? 'عدد الطلاب' : 'Student Count' }
  ];

  // Combine all sections
  const sections = [
    `=== ${isAr ? 'ملخص الإحصائيات' : 'Statistics Summary'} ===`,
    convertToCSV(summaryData, summaryHeaders),
    '',
    `=== ${isAr ? 'إحصائيات الأقسام' : 'Department Statistics'} ===`,
    convertToCSV(deptData, deptHeaders),
    '',
    `=== ${isAr ? 'توزيع المعدلات' : 'GPA Distribution'} ===`,
    convertToCSV(gpaData, gpaHeaders),
    '',
    `=== ${isAr ? 'توزيع المخاطر' : 'Risk Distribution'} ===`,
    convertToCSV(riskData, riskHeaders)
  ];

  const content = sections.join('\n');
  const filename = `advisor_statistics_${timestamp}.csv`;
  
  downloadFile(content, filename, 'text/csv;charset=utf-8');
};

export const exportStudentListToExcel = (
  students: Array<{
    name: string;
    studentId: string;
    department: string;
    gpa: number;
    riskLevel: string;
  }>,
  language: 'ar' | 'en'
) => {
  const isAr = language === 'ar';
  const timestamp = new Date().toISOString().split('T')[0];

  const headers = [
    { key: 'name', label: isAr ? 'الاسم' : 'Name' },
    { key: 'studentId', label: isAr ? 'الرقم الجامعي' : 'Student ID' },
    { key: 'department', label: isAr ? 'القسم' : 'Department' },
    { key: 'gpa', label: isAr ? 'المعدل' : 'GPA' },
    { key: 'riskLevel', label: isAr ? 'مستوى الخطر' : 'Risk Level' }
  ];

  const data: ExcelRow[] = students.map(s => ({
    name: s.name,
    studentId: s.studentId,
    department: s.department,
    gpa: s.gpa,
    riskLevel: s.riskLevel
  }));

  const content = convertToCSV(data, headers);
  const filename = `student_list_${timestamp}.csv`;
  
  downloadFile(content, filename, 'text/csv;charset=utf-8');
};
