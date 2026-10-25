import { PageHeader } from "@/components/dashboard/PageHeader";
import { MonitoringClient } from "./monitoring-client";

export default async function MonitoringPage() {
  return (
    <div>
      <PageHeader title="Monitoring" subtitle="System health and performance metrics" />
      <MonitoringClient />
    </div>
  );
}
