const BASE = "https://apiv2.shiprocket.in/v1/external";

export async function getToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Shiprocket auth failed ${res.status}`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("Shiprocket did not return a token");
  return data.token;
}

interface ShipOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  total: number;
  items: { name: string; qty: number; unitPrice: number }[];
}

export async function createShipment(
  token: string,
  order: ShipOrder,
): Promise<{ shipmentId: string; awb: string; courier: string }> {
  const res = await fetch(`${BASE}/orders/create/adhoc`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: order.id,
      order_date: new Date().toISOString().slice(0, 10),
      billing_customer_name: order.customerName,
      billing_phone: order.customerPhone.replace(/\D/g, "").slice(-10),
      billing_address: order.customerAddress ?? "N/A",
      billing_city: "NA",
      billing_pincode: "000000",
      billing_state: "NA",
      billing_country: "India",
      payment_method: "Prepaid",
      sub_total: order.total,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
      order_items: order.items.map((i) => ({ name: i.name, units: i.qty, selling_price: i.unitPrice })),
    }),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json()) as { shipment_id?: number | string; awb_code?: string; courier_name?: string };
  if (!res.ok || !data.shipment_id) throw new Error("Shiprocket shipment creation failed");
  return {
    shipmentId: String(data.shipment_id),
    awb: data.awb_code ?? "",
    courier: data.courier_name ?? "",
  };
}

export async function trackShipment(
  token: string,
  awb: string,
): Promise<{ status: string; location: string; eta: string }> {
  const res = await fetch(`${BASE}/courier/track/awb/${awb}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  const data = (await res.json()) as {
    tracking_data?: { shipment_track?: { current_status?: string; destination?: string }[]; etd?: string };
  };
  const t = data.tracking_data?.shipment_track?.[0];
  return { status: t?.current_status ?? "Unknown", location: t?.destination ?? "", eta: data.tracking_data?.etd ?? "" };
}
