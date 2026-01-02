import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface StudentData {
  name: string;
  studentId: string;
  department: string;
  yearLevel: number;
  gpa: number;
  totalCredits: number;
  email: string;
}

interface CourseData {
  name: string;
  code: string;
  credits: number;
  grade?: string;
  semester: string;
}

export const exportStudentReportPDF = (
  student: StudentData,
  courses: CourseData[],
  language: 'ar' | 'en' = 'ar'
) => {
  const doc = new jsPDF();
  const isRTL = language === 'ar';
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // Primary blue
  const title = isRTL ? 'تقرير الطالب الأكاديمي' : 'Student Academic Report';
  doc.text(title, 105, 20, { align: 'center' });
  
  // University name
  doc.setFontSize(14);
  doc.setTextColor(100);
  const university = isRTL ? 'الجامعة السورية الخاصة - IntelliPath' : 'Syrian Private University - IntelliPath';
  doc.text(university, 105, 30, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(20, 184, 166); // Teal accent
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  // Student Info Section
  doc.setFontSize(12);
  doc.setTextColor(0);
  
  const studentInfoY = 45;
  const labels = isRTL 
    ? ['الاسم:', 'الرقم الجامعي:', 'القسم:', 'السنة الدراسية:', 'المعدل التراكمي:', 'الساعات المكتسبة:', 'البريد الإلكتروني:']
    : ['Name:', 'Student ID:', 'Department:', 'Year Level:', 'GPA:', 'Credits Earned:', 'Email:'];
  
  const values = [
    student.name,
    student.studentId,
    student.department,
    String(student.yearLevel),
    student.gpa.toFixed(2),
    String(student.totalCredits),
    student.email
  ];
  
  labels.forEach((label, i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, studentInfoY + (i * 8));
    doc.setFont('helvetica', 'normal');
    doc.text(values[i], 70, studentInfoY + (i * 8));
  });
  
  // Courses Table
  if (courses.length > 0) {
    const tableStartY = studentInfoY + (labels.length * 8) + 15;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const coursesTitle = isRTL ? 'المقررات المسجلة' : 'Enrolled Courses';
    doc.text(coursesTitle, 20, tableStartY);
    
    const tableHeaders = isRTL 
      ? ['الفصل', 'الدرجة', 'الساعات', 'الرمز', 'اسم المقرر']
      : ['Course Name', 'Code', 'Credits', 'Grade', 'Semester'];
    
    const tableData = courses.map(course => [
      course.name,
      course.code,
      String(course.credits),
      course.grade || '-',
      course.semester
    ]);
    
    (doc as any).autoTable({
      startY: tableStartY + 5,
      head: [tableHeaders],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [240, 249, 255],
      },
    });
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  const date = new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US');
  const footer = isRTL ? `تاريخ التقرير: ${date}` : `Report Date: ${date}`;
  doc.text(footer, 105, pageHeight - 10, { align: 'center' });
  
  // Save
  const filename = isRTL ? `تقرير_${student.name}.pdf` : `Report_${student.name}.pdf`;
  doc.save(filename);
};
