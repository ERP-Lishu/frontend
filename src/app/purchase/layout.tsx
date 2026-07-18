import { PartiesProvider } from "@/context/PartiesContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { SalesProvider } from "@/context/SalesContext";
import { PurchaseProvider } from "@/context/PurchaseContext";
import { PaymentsProvider } from "@/context/PaymentsContext";

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <PartiesProvider>
      <InventoryProvider>
        <SalesProvider>
          <PurchaseProvider>
            <PaymentsProvider>
              {children}
            </PaymentsProvider>
          </PurchaseProvider>
        </SalesProvider>
      </InventoryProvider>
    </PartiesProvider>
  );
}
