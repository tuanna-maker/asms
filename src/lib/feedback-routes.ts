export const feedbackPaths = {
  list: "/phan-anh",
  statistics: "/phan-anh/thong-ke",
  create: "/phan-anh/moi",
  detail: (id: string) => `/phan-anh/${id}`,
  edit: (id: string) => `/phan-anh/${id}/sua`,
};

export function feedbackListUrl(params?: {
  customerId?: string;
  status?: string;
  feedbackFrom?: string;
  feedbackTo?: string;
}): string {
  const q = new URLSearchParams();
  if (params?.customerId) q.set("customerId", params.customerId);
  if (params?.status) q.set("status", params.status);
  if (params?.feedbackFrom) q.set("feedbackFrom", params.feedbackFrom);
  if (params?.feedbackTo) q.set("feedbackTo", params.feedbackTo);
  const qs = q.toString();
  return qs ? `${feedbackPaths.list}?${qs}` : feedbackPaths.list;
}

export function feedbackCreateUrl(params?: {
  customerId?: string;
  contractId?: string;
  warrantyId?: string;
}): string {
  const q = new URLSearchParams();
  if (params?.customerId) q.set("customerId", params.customerId);
  if (params?.contractId) q.set("contractId", params.contractId);
  if (params?.warrantyId) q.set("warrantyId", params.warrantyId);
  const qs = q.toString();
  return qs ? `${feedbackPaths.create}?${qs}` : feedbackPaths.create;
}
