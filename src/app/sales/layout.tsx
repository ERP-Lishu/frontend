import { PartiesProvider } from "@/context/PartiesContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { SalesProvider } from "@/context/SalesContext";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <PartiesProvider>
      <InventoryProvider>
        <SalesProvider>
          {children}
        </SalesProvider>
      </InventoryProvider>
    </PartiesProvider>
  );
}
