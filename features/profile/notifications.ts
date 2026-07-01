import { requestSupabaseRest } from "@/lib/supabase";

/**
 * Records a profile view.
 * 
 * This function inserts a record into the 'profile_views' table. 
 * The database trigger 'on_profile_view_created' (defined in schema.sql) 
 * will automatically handle creating the notification for the profile owner.
 * 
 * @param viewerId - The ID of the authenticated user performing the view
 * @param profileOwnerId - The ID of the user whose profile is being viewed
 */
export async function trackProfileView(viewerId: string, profileOwnerId: string) {
  if (!viewerId || !profileOwnerId || viewerId === profileOwnerId) return;

  await requestSupabaseRest("profile_views", {
    body: {
      viewer_id: viewerId,
      viewed_user_id: profileOwnerId
    },
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    }
  });
}
