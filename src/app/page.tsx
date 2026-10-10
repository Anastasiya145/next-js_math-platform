import { redirect } from "next/navigation";
import { Button, Chip, Grid, List } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import FactCheckIcon from "@mui/icons-material/FactCheckOutlined";
import GroupsIcon from "@mui/icons-material/GroupsOutlined";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import SchoolIcon from "@mui/icons-material/SchoolOutlined";
import StarIcon from "@mui/icons-material/StarOutlineRounded";
import { auth } from "@/auth";
import { listHomeworkForTeacher, listStudents } from "@/lib/db";
import { formatLesson } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { ItemRow } from "@/components/ItemRow";
import { PageSection } from "@/components/PageSection";
import { StatCard } from "@/components/StatCard";
import { toneAt } from "@/components/tones";
import { homeworkStatus, pendingReviewCount } from "./homework/status";
import { router } from "./router";

export default async function Home() {
  const session = await auth();
  if (session?.user.role === "student") redirect(router.student);

  const [students, homeworks] = await Promise.all([listStudents(), listHomeworkForTeacher()]);
  const classes = Object.entries(Object.groupBy(students, (student) => student.grade)).sort(
    ([first], [second]) => Number(first) - Number(second),
  );
  const scores = homeworks.flatMap((homework) =>
    homework.students.flatMap((student) =>
      student.gradedAt && student.score !== null ? [student.score] : [],
    ),
  );
  const average = scores.length
    ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
    : "—";
  const today = new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <AppShell
      title="Огляд"
      subtitle={today.charAt(0).toUpperCase() + today.slice(1)}
      actions={
        <Button variant="contained" href={router.homework}>
          Нове завдання
        </Button>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Учнів" value={students.length} icon={<PeopleIcon />} tone="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Класів" value={classes.length} icon={<GroupsIcon />} tone="info" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Потрібно перевірити"
            value={homeworks.reduce((sum, homework) => sum + pendingReviewCount(homework), 0)}
            icon={<FactCheckIcon />}
            tone="warning"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Середній бал"
            value={average}
            hint={`${scores.length} оцінених робіт`}
            icon={<StarIcon />}
            tone="success"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <PageSection
            title="Останні завдання"
            icon={<AssignmentIcon />}
            tone="warning"
            action={<Button href={router.homework}>Усі завдання</Button>}
            empty={homeworks.length === 0}
            emptyText="Поки немає призначених завдань"
          >
            <List disablePadding>
              {homeworks.slice(0, 5).map((homework) => {
                const status = homeworkStatus(homework);
                return (
                  <ItemRow
                    key={homework.id}
                    tone={status.tone}
                    icon={<AssignmentIcon />}
                    primary={homework.title}
                    secondary={`${homework.students.length} учн.${
                      homework.nextLessonAt ? ` · урок ${formatLesson(homework.nextLessonAt)}` : ""
                    }`}
                    actions={<Chip size="small" color={status.tone} label={status.label} />}
                  />
                );
              })}
            </List>
          </PageSection>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <PageSection
            title="Мої класи"
            icon={<SchoolIcon />}
            tone="info"
            empty={classes.length === 0}
            emptyText="Поки немає учнів"
          >
            <List disablePadding>
              {classes.map(([grade, items], index) => (
                <ItemRow
                  key={grade}
                  tone={toneAt(index)}
                  icon={grade}
                  primary={`${grade} клас`}
                  secondary={`${items?.length} учн.`}
                />
              ))}
            </List>
          </PageSection>
        </Grid>
      </Grid>
    </AppShell>
  );
}
