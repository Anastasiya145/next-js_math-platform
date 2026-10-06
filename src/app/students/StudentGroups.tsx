"use client";

import type { Student } from "./types";
import Link from "next/link";
import { router } from "../router";
import { useState } from "react";
import { StudentEditForm } from "./StudentEditForm";
import { ChartNoAxesColumnIncreasing, Pencil, Trash2, Eye } from "lucide-react";

type StudentGroupsProps = {
  students: Student[];
  loading: boolean;
  onDelete: (id: number) => void;
  onEdit: (
    id: number,
    name: string,
    grade: number,
    email: string,
    temporaryPassword: string,
  ) => Promise<boolean>;
};

export function StudentGroups({ students, loading, onDelete, onEdit }: StudentGroupsProps) {
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const studentsByGrade = students.reduce<Record<number, Student[]>>((groups, student) => {
    (groups[student.grade] ??= []).push(student);
    return groups;
  }, {});

  return (
    <section className="panel students-list-panel" aria-busy={loading}>
      <div className="panel-header">
        <div>
          <span className="eyebrow">СПИСОК</span>
          <h2>Усі учні ({students.length})</h2>
        </div>
      </div>
      {loading ? (
        <p className="materials-empty" role="status">
          Завантаження…
        </p>
      ) : students.length === 0 ? (
        <p className="materials-empty">Поки немає жодного учня</p>
      ) : (
        Object.entries(studentsByGrade)
          .sort(([first], [second]) => Number(first) - Number(second))
          .map(([grade, gradeStudents]) => (
            <section className="student-grade-group" key={grade}>
              <h3>{grade} клас</h3>
              <ul className="materials-file-list">
                {gradeStudents.map((student) => (
                  <li key={student.id} className="materials-file">
                    <span className="materials-file-icon" aria-hidden="true">
                      ◎
                    </span>
                    {editingStudentId === student.id ? (
                      <div className="student-edit-content">
                        <StudentEditForm
                          studentId={student.id}
                          initialName={student.name}
                          initialGrade={student.grade}
                          initialEmail={student.email}
                          onSave={onEdit}
                          onCancel={() => setEditingStudentId(null)}
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <b>{student.name}</b>
                          <small>{student.email ?? `${grade} клас · без входу`}</small>
                        </div>
                        <Link
                          className="icon-action"
                          href={router.studentView(student.id)}
                          aria-label={`Переглянути кабінет ${student.name}`}
                          title="Переглянути кабінет учня"
                        >
                          <Eye aria-hidden="true" size={18} />
                        </Link>
                        <Link
                          className="icon-action"
                          href={router.studentProgress(student.id)}
                          aria-label={`Переглянути прогрес ${student.name}`}
                          title="Прогрес учня"
                        >
                          <ChartNoAxesColumnIncreasing aria-hidden="true" size={18} />
                        </Link>
                        <button
                          className="icon-action"
                          type="button"
                          aria-label={`Редагувати учня ${student.name}`}
                          title="Редагувати учня"
                          onClick={() => setEditingStudentId(student.id)}
                        >
                          <Pencil aria-hidden="true" size={18} />
                        </button>
                        <button
                          className="icon-action icon-action-danger"
                          type="button"
                          aria-label={`Видалити учня ${student.name}`}
                          title="Видалити учня"
                          onClick={() => onDelete(student.id)}
                        >
                          <Trash2 aria-hidden="true" size={18} />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </section>
  );
}
