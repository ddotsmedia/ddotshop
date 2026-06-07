import { PageHeader } from "@/components/dashboard/PageHeader";
import { BundleForm } from "@/components/dashboard/BundleForm";

export default function NewBundlePage() {
  return (
    <div>
      <PageHeader title="New bundle" subtitle="Group products at a special price" />
      <BundleForm />
    </div>
  );
}
