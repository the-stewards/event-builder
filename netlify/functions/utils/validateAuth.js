export function validateAuth(context) {
  const user = context?.clientContext?.user;
  if (!user) throw new Error("Unauthorized");
  return user;
}
