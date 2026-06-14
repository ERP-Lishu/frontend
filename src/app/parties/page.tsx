import { PartiesProvider } from "@/context/PartiesContext";
import { SalesProvider } from "@/context/SalesContext";
import { PurchaseProvider } from "@/context/PurchaseContext";
import { PartiesPage } from "@/components/parties";

export default function Page() {
  return (
    <PartiesProvider>
      <SalesProvider>
        <PurchaseProvider>
          <PartiesPage />
        </PurchaseProvider>
      </SalesProvider>
    </PartiesProvider>
  );
}
