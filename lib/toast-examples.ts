// Example usage of the toast system:
//
// import { useToast } from "@/lib/toast-context";
//
// const { addToast } = useToast();
//
// // Show success toast
// addToast({
//   type: "success",
//   message: "Profile updated successfully!",
//   duration: 3000,
// });
//
// // Show error toast
// addToast({
//   type: "error",
//   title: "Upload Failed",
//   message: "Please try again later.",
//   duration: 5000,
// });
//
// // Show info toast (no auto-dismiss)
// addToast({
//   type: "info",
//   title: "New Feature",
//   message: "Check out our new messaging system!",
// });
//
// // Show info toast with auto-dismiss
// addToast({
//   type: "info",
//   message: "This will disappear in 4 seconds.",
//   duration: 4000,
// });
