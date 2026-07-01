import React from "react";
import { QRCodeSVG } from "qrcode.react";

export function DesktopJoinQrCode({ className, link }: { className?: string; link?: string }) {
  const qrValue = link || "https://bliss.vercel.app"; // Fallback URL

  return (
    <div 
      className={`desktop-join-qr relative flex items-center justify-center p-3 bg-white rounded-xl shadow-inner ${className || ""}`} 
      aria-hidden="true"
    >
      <QRCodeSVG
        value={qrValue}
        size={150}
        level="H" // High error correction to allow for the logo
        includeMargin={false}
        imageSettings={{
          src: "/images/bliss_icon.png",
          x: undefined,
          y: undefined,
          height: 32,
          width: 32,
          excavate: true, // This clears the QR modules behind the logo
        }}
        // Custom colors matching your branded CSS if needed
        fgColor="#000000"
        bgColor="#FFFFFF"
      />
    </div>
  );
}