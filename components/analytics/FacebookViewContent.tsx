"use client";

import { useEffect, useRef } from "react";
import { trackFacebookViewContent } from "@/lib/facebook-pixel";

type FacebookViewContentProps = {
  propertyId: string;
  title: string;
  type: string;
  price: number;
};

export default function FacebookViewContent({
  propertyId,
  title,
  type,
  price,
}: FacebookViewContentProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;
    trackFacebookViewContent({
      contentIds: [propertyId],
      contentName: title,
      contentCategory: type,
      value: price,
      currency: "DZD",
    });
  }, [propertyId, title, type, price]);

  return null;
}
