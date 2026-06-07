import { PageHeader } from "@/components/dashboard/PageHeader";
import { FlashSaleForm } from "@/components/dashboard/FlashSaleForm";

export default function NewFlashSalePage() {
  return (
    <div>
      <PageHeader title="New flash sale" subtitle="Set a time window and discounted prices" />
      <FlashSaleForm />
    </div>
  );
}
