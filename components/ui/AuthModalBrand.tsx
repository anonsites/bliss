"use client";

import Image from "next/image";

export function AuthModalBrand() {
  return (
    <div className="auth-modal-brand" aria-hidden="true">
      <Image
        alt=""
        className="auth-modal-brand__image"
        height={56}
        src="/images/bliss_icon.png"
        width={56}
      />
    </div>
  );
}
