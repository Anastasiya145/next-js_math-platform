export const router = {
  home: { href: "/", activePath: null },
  dashboard: { href: "/#dashboard", activePath: "/" },
  classes: { href: "/#classes", activePath: null },
  assignments: { href: "/homework", activePath: "/homework" },
  student: { href: "/student", activePath: "/student" },
  studentProgress: (studentId: number) => `/students/${studentId}`,
  materials: { href: "/materials", activePath: "/materials" },
  students: {
    href: "/students",
    activePath: "/students",
  },
  analytics: { href: "/#analytics", activePath: null },
  login: { href: "/login", activePath: null },
  api: {
    students: "/api/students",
    student: (studentId: number) => `/api/students?id=${studentId}`,
    materials: "/api/materials",
    textbooks: "/api/textbooks",
    textbook: (textbookId: number) => `/api/textbooks/${textbookId}`,
    assignments: "/api/assignments",
    homeworkSubmission: (homeworkId: number) =>
      `/api/assignments/${homeworkId}/submission`,
    homeworkNoHomework: (homeworkId: number) =>
      `/api/assignments/${homeworkId}/no-homework`,
    homeworkGrade: (homeworkId: number) =>
      `/api/assignments/${homeworkId}/grade`,
    studentDashboard: "/api/student/dashboard",
    studentProgress: (studentId: number) =>
      `/api/students/${studentId}/progress`,
  },
} as const;

export const sidebarItems = [
  { route: router.dashboard, label: "Огляд", icon: "◈", badge: null },
  { route: router.classes, label: "Мої класи", icon: "▦", badge: "classes" },
  {
    route: router.assignments,
    label: "Домашні завдання",
    icon: "◇",
    badge: null,
  },
  { route: router.materials, label: "Матеріали", icon: "⎘", badge: null },
  { route: router.students, label: "Учні", icon: "◎", badge: null },
  { route: router.analytics, label: "Успішність", icon: "⌁", badge: null },
] as const;
