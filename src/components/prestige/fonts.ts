import localFont from "next/font/local";

/** Display serif used only on Found Prestige pages. */
export const prestigeSerif = localFont({
  src: [
    { path: "../../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2", style: "normal" },
    { path: "../../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2", style: "italic" },
  ],
  weight: "300 700",
  variable: "--font-prestige",
  display: "swap",
});
