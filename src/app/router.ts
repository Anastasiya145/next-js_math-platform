export const router = {
  home: "/",
  students: "/students",
  homework: "/homework",
  materials: "/materials",
  student: "/student",
  login: "/login",
  studentView: (studentId: number) => `/students/${studentId}`,
  api: {
    students: "/api/students",
    student: (studentId: number) => `/api/students?id=${studentId}`,
    studentTextbooks: (studentId: number) => `/api/students/${studentId}/textbooks`,
    materials: "/api/materials",
    nush: "/api/nush",
    textbooks: "/api/textbooks",
    textbook: (textbookId: number) => `/api/textbooks/${textbookId}`,
    assignments: "/api/assignments",
    assignment: (homeworkId: number) => `/api/assignments/${homeworkId}`,
    homeworkSubmission: (homeworkId: number) => `/api/assignments/${homeworkId}/submission`,
    homeworkNoHomework: (homeworkId: number) => `/api/assignments/${homeworkId}/no-homework`,
    homeworkGrade: (homeworkId: number) => `/api/assignments/${homeworkId}/grade`,
    studentDashboard: "/api/student/dashboard",
    changePassword: "/api/student/change-password",
  },
} as const;

export const navItems = [
  { href: router.home, label: "Огляд" },
  { href: router.students, label: "Учні" },
  { href: router.homework, label: "Домашні завдання" },
  { href: router.materials, label: "Матеріали" },
] as const;
