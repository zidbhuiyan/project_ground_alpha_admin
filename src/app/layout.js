import NavbarWrapper from "./components/NavbarWrapper";
import "./globals.css";

export const metadata = {
  title: "Admin Panel",
  description: "Admin Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavbarWrapper>{children}</NavbarWrapper>
      </body>
    </html>
  );
}
