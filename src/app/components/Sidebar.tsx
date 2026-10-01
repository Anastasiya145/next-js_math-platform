"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { router, sidebarItems } from "../router";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [classCount, setClassCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(router.api.students)
      .then((res) => res.json())
      .then((json) => {
        const grades = new Set(
          (json.data ?? []).map((s: { grade: number }) => s.grade),
        );
        setClassCount(grades.size);
      })
      .catch(() => setClassCount(null));
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">∑</span>
        <span>
          Математика
          <br />
          <b>з Анастасією</b>
        </span>
      </div>
      <nav className="nav" aria-label="Основна навігація">
        {sidebarItems.map((item) => {
          const isActive = item.route.activePath === pathname;
          return (
            <Link
              key={item.route.href}
              className={`nav-item${isActive ? " active" : ""}`}
              href={item.route.href}
              aria-current={isActive ? "page" : undefined}
            >
              <span>{item.icon}</span> {item.label}
              {item.badge === "classes" && classCount ? (
                <em>{classCount}</em>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="tip">
          <span>✦</span>
          <p>
            <b>Маленький крок</b>
            <br />
            Сьогодні перевірено 8 робіт. Ще одна — і день закрито.
          </p>
        </div>
        <div className="profile">
          <span className="avatar">
            {session?.user?.name?.charAt(0).toUpperCase() ?? "А"}
          </span>
          <span>
            <b>{session?.user?.name ?? "Анастасія Іванова"}</b>
            <small>{session?.user?.email ?? "Репетитор"}</small>
          </span>
          <button
            className="dots"
            aria-label="Вийти"
            title="Вийти"
            onClick={() => signOut({ redirectTo: router.login.href })}
          >
            ⤳
          </button>
        </div>
      </div>
    </aside>
  );
}
