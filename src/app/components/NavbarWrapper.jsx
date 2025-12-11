"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";

export default function NavbarWrapper({ children }) {
  const pathname = usePathname();

  // Routes where navbar should NOT appear
  const hideNavbarRoutes = ["/", "/forgot-password"];

  const hideNavbar = hideNavbarRoutes.includes(pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}

      <div style={{ paddingTop: hideNavbar }}>{children}</div>
    </>
  );
}
