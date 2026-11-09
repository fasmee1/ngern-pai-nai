import type { MetadataRoute } from "next";

// Lets people add the site to their home screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "เงินไปไหน",
    short_name: "เงินไปไหน",
    description: "จดรายรับรายจ่าย แล้วรู้ทันทีว่าเงินหายไปไหน",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#918df6",
    lang: "th",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
