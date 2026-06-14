import { InventoryProvider } from "@/context/InventoryContext";
import { POSPage } from "@/components/pos/POSPage";

export default function Page() {
  return (
    <InventoryProvider>
      <POSPage />
    </InventoryProvider>
  );
}
