import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getWishlistProfilesForUser } from "@/features/wishlist/server";
import { WishlistPageClient } from "@/app/radar/_components/WishlistPageClient";

export default async function RadarWishlistPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (!authenticatedUser.profileCompletedAt) {
    redirect("/checkpoint");
  }

  const wishlistResult = await getWishlistProfilesForUser(authenticatedUser.id);

  return (
    <WishlistPageClient
      initialError={wishlistResult.error ?? null}
      profiles={wishlistResult.profiles}
    />
  );
}
