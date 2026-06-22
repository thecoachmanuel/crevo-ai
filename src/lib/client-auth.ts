export function getSessionToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )polaris_session=([^;]+)"));
  return match ? match[2] : undefined;
}
