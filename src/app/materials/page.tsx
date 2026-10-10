"use client";

import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { AppShell } from "@/components/AppShell";
import { ClassMaterials } from "./ClassMaterials";
import { NushTopicsManager } from "./NushTopicsManager";
import { TextbookManager } from "./TextbookManager";

const TABS = [
  // { label: "Класи й файли", content: <ClassMaterials /> },
  { label: "Програма НУШ", content: <NushTopicsManager /> },
  { label: "Підручники", content: <TextbookManager /> },
];

export default function MaterialsPage() {
  const [tab, setTab] = useState(0);

  return (
    <AppShell title="Матеріали" subtitle="Файли за класами, програма НУШ і підручники">
      <Tabs
        value={tab}
        onChange={(_, value: number) => setTab(value)}
        variant="scrollable"
        sx={{ mb: 2 }}
      >
        {TABS.map((item) => (
          <Tab key={item.label} label={item.label} />
        ))}
      </Tabs>
      <Box role="tabpanel">{TABS[tab].content}</Box>
    </AppShell>
  );
}
