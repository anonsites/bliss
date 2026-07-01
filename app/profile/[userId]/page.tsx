import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { getPublicProfileViewData } from "@/features/profile/server";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (!authenticatedUser.profileCompletedAt) {
    redirect("/checkpoint");
  }

  const { userId } = await params;
  const publicProfile = await getPublicProfileViewData(userId, authenticatedUser.id);

  if (!publicProfile) {
    redirect("/radar");
  }

  return (
    <div className="flex min-h-screen flex-col bg-black px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-2xl font-semibold">
            {publicProfile.avatar_url ? (
              <img alt={publicProfile.username} className="h-full w-full object-cover" src={publicProfile.avatar_url} />
            ) : (
              publicProfile.username.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{publicProfile.username}</h1>
            <p className="text-sm text-gray-400">{publicProfile.location_label}</p>
          </div>
        </div>

        {publicProfile.bio ? <p className="text-sm text-gray-300">{publicProfile.bio}</p> : null}

        {publicProfile.phone_number ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Phone: {publicProfile.phone_number}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
            Contact details are hidden for this profile.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {publicProfile.user_media.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img alt={publicProfile.username} className="h-48 w-full object-cover" src={item.media_url} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
