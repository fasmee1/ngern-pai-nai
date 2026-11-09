"use client";

import { useState } from "react";
import { initialOf } from "@/lib/input";

// Round profile picture. Shows the Google photo when there is one,
// and falls back to the first letter of the name on the person's chosen color.
export function Avatar({
  name,
  color,
  size = 44,
  photo = null,
}: {
  name: string;
  color: string;
  size?: number;
  photo?: string | null;
}) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const showPhoto = photo !== null && photo !== failedPhoto;

  return (
    <span
      className="avatar-badge"
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.44) }}
      aria-hidden="true"
    >
      {showPhoto ? (
        // A plain img keeps this simple for a small Google-hosted picture.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          onError={() => setFailedPhoto(photo)}
        />
      ) : (
        initialOf(name)
      )}
    </span>
  );
}
