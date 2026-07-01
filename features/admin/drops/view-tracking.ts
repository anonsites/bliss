export function buildTrackPromoDropViewRequest(userId: string, promoDropId: string) {
  return {
    body: {
      promo_drop_id: promoDropId,
      user_id: userId,
    },
    headers: {
      Prefer: "return=minimal",
    },
    method: "POST" as const,
  };
}
