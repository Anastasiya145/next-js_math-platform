"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { router, sidebarItems } from "../router";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [classCount, setClassCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(router.api.students)
      .then((res) => res.json())
      .then((json) => {
        const grades = new Set((json.data ?? []).map((s: { grade: number }) => s.grade));
        setClassCount(grades.size);
      })
      .catch(() => setClassCount(null));
  }, []);

  // Close menu when pressing Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && <div className="mobile-menu-overlay" onClick={onClose} />}

      {/* Mobile menu panel */}
      <div className={`mobile-menu ${isOpen ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <div className="brand">
            <span className="brand-mark">∑</span>
            <span>
              Математика
              <br />
              <b>з Анастасією</b>
            </span>
          </div>
          <button className="mobile-menu-close" aria-label="Закрити меню" onClick={onClose}>
            ✕
          </button>
        </div>

        <nav className="mobile-menu-nav" aria-label="Основна навігація">
          {sidebarItems.map((item) => {
            const isActive = item.route.activePath === pathname;
            return (
              <Link
                key={item.route.href}
                className={`mobile-nav-item${isActive ? " active" : ""}`}
                href={item.route.href}
                onClick={onClose}
              >
                <span>{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
                {item.badge === "classes" && classCount ? (
                  <span className="mobile-nav-badge">{classCount}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mobile-menu-footer">
          <div className="mobile-profile">
            <span className="avatar">{session?.user?.name?.charAt(0).toUpperCase() ?? "А"}</span>
            <div>
              <b>{session?.user?.name ?? "Анастасія Іванова"}</b>
              <small>{session?.user?.email ?? "Репетитор"}</small>
            </div>
          </div>
          <button
            className="mobile-logout-btn"
            onClick={() => signOut({ redirectTo: router.login.href })}
          >
            ⤳ Вийти
          </button>
        </div>
      </div>
    </>
  );
}
