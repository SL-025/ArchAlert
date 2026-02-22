import "./globals.css";

export const metadata = {
  title: "ArchAlert",
  description: "Urban Safety Awareness",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}