import { PartiesProvider } from "@/context/PartiesContext";
import { SalesProvider } from "@/context/SalesContext";
import { PurchaseProvider } from "@/context/PurchaseContext";
import { PaymentsProvider } from "@/context/PaymentsContext";
import { PartiesPage } from "@/components/parties";

export default function Page() {
  return (
    <PartiesProvider>
      <SalesProvider>
        <PurchaseProvider>
          <PaymentsProvider>
            <PartiesPage />
          </PaymentsProvider>
        </PurchaseProvider>
      </SalesProvider>
    </PartiesProvider>
  );
}
