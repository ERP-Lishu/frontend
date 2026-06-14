"use client";

import { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { InventoryTableView } from "./InventoryTableView";
import { InventorySplitView } from "./InventorySplitView";

export function InventoryPage() {
  const { items, deleteItem } = useInventory();
  const [view, setView] = useState<"table" | "split">("table");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  function handleItemClick(i: number) {
    setSelectedIdx(i);
    setView("split");
  }

  function handleDelete(id: string) {
    deleteItem(id);
    setView("table");
    setSelectedIdx(null);
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {view === "table" ? (
        <InventoryTableView items={items} onItemClick={handleItemClick} />
      ) : (
        <InventorySplitView
          items={items}
          selectedIdx={selectedIdx}
          onBack={() => setView("table")}
          onSelectItem={setSelectedIdx}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
