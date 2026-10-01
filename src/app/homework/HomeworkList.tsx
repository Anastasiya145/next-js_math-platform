"use client";

import type { TeacherHomework } from "./types";
import { HomeworkCard } from "./HomeworkCard";

type HomeworkListProps = {
  homeworks: TeacherHomework[];
  onRefresh: () => Promise<void>;
};

export function HomeworkList({ homeworks, onRefresh }: HomeworkListProps) {
  if (homeworks.length === 0) {
    return (
      <p className="materials-empty">Поки немає призначених домашніх робіт.</p>
    );
  }

  return (
    <section className="homework-list" aria-label="Призначені домашні роботи">
      {homeworks.map((homework) => (
        <HomeworkCard
          key={homework.id}
          homework={homework}
          onRefresh={onRefresh}
        />
      ))}
    </section>
  );
}
