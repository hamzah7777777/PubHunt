export function joinUrl(slug: string) {
  return `${window.location.origin}/toastmasters/join/?event=${slug}`;
}

export function displayUrl(slug: string) {
  return `${window.location.origin}/toastmasters/display/?event=${slug}`;
}

export function getEventSlug() {
  return new URLSearchParams(window.location.search).get('event') ?? '';
}
