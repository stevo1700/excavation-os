import QRCode from "qrcode";

/** Render `url` as a QR code, returned as raw `<svg>…</svg>` markup. */
export async function generateQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 1 });
}

/**
 * The canonical scan URL for an equipment asset tag: `NEXT_PUBLIC_APP_URL` +
 * `/e/<assetTag>`, or a relative path if that env var isn't set (e.g. local
 * dev, or a preview deploy that hasn't configured it yet).
 */
export function qrUrlForTag(assetTag: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  return base ? `${base}/e/${assetTag}` : `/e/${assetTag}`;
}
