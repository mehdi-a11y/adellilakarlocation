declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim();

export function isFacebookPixelEnabled() {
  return Boolean(FACEBOOK_PIXEL_ID && /^\d+$/.test(FACEBOOK_PIXEL_ID));
}

export function trackFacebookEvent(
  event: string,
  params?: Record<string, string | number | undefined>
) {
  if (typeof window === "undefined" || !isFacebookPixelEnabled() || !window.fbq) {
    return;
  }

  if (params) {
    window.fbq("track", event, params);
    return;
  }

  window.fbq("track", event);
}

export function trackFacebookPageView() {
  trackFacebookEvent("PageView");
}

export function trackFacebookViewContent(params: {
  contentIds: string[];
  contentName: string;
  contentCategory?: string;
  value?: number;
  currency?: string;
}) {
  if (typeof window === "undefined" || !isFacebookPixelEnabled() || !window.fbq) {
    return;
  }

  window.fbq("track", "ViewContent", {
    content_ids: params.contentIds,
    content_name: params.contentName,
    content_type: "home_listing",
    content_category: params.contentCategory,
    value: params.value,
    currency: params.currency ?? "DZD",
  });
}

export function trackFacebookLead(params?: {
  contentName?: string;
  value?: number;
  currency?: string;
}) {
  trackFacebookEvent("Lead", {
    content_name: params?.contentName,
    value: params?.value,
    currency: params?.currency ?? "DZD",
  });
}
