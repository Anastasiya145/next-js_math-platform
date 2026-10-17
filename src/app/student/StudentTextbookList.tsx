import { Chip, List } from "@mui/material";
import BookIcon from "@mui/icons-material/MenuBookOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PracticeIcon from "@mui/icons-material/FitnessCenterOutlined";
import { IconAction, ItemRow } from "@/components/ItemRow";
import type { StudentDashboardData } from "./types";
import { useAppLanguage } from "@/lib/LanguageProvider";

export function StudentTextbookList({
  textbooks,
}: {
  textbooks: StudentDashboardData["textbooks"];
}) {
  const { t } = useAppLanguage();
  return (
    <List disablePadding>
      {textbooks.map((textbook) => (
        <ItemRow
          key={textbook.id}
          tone={textbook.resourceType === "practice" ? "secondary" : "primary"}
          icon={
            textbook.resourceType === "practice" ? (
              <PracticeIcon />
            ) : (
              <BookIcon />
            )
          }
          primary={textbook.title}
          secondary={[
            textbook.subject,
            textbook.resourceType === "practice"
              ? t("practice")
              : t("textbook"),
            textbook.author,
          ]
            .filter(Boolean)
            .join(" · ")}
          actions={
            <>
              {textbook.isDemo && (
                <Chip size="small" color="info" label={t("demo")} />
              )}
              <IconAction
                label={t("openResource", { title: textbook.title })}
                href={textbook.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <OpenInNewIcon />
              </IconAction>
            </>
          }
        />
      ))}
    </List>
  );
}
