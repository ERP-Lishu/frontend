import { PartiesProvider } from "@/context/PartiesContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { PurchaseProvider } from "@/context/PurchaseContext";

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <PartiesProvider>
      <InventoryProvider>
        <PurchaseProvider>
          {children}
        </PurchaseProvider>
      </InventoryProvider>
    </PartiesProvider>
  );
}
