"use client";

import { UserButton } from "@clerk/nextjs";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transações" },
  { href: "/goals", label: "Metas" },
  { href: "/subscription", label: "Assinatura" },
];

const Navbar = () => {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    pathname === href ? "font-bold text-primary" : "text-muted-foreground";

  return (
    <nav className="flex w-full items-center justify-between border-b border-solid px-4 py-4 md:px-8">
      {/* ESQUERDA */}
      <div className="flex items-center gap-4 md:gap-10">
        <Image src="/logo.svg" width={173} height={39} alt="Finance AI" />

        {/* Links visíveis apenas em md+ */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* DIREITA */}
      <div className="flex items-center gap-3">
        <UserButton showName />

        {/* Hambúrguer — visível apenas em mobile */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <MenuIcon size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px]">
            <SheetHeader>
              <SheetTitle asChild>
                <Image
                  src="/logo.svg"
                  width={140}
                  height={32}
                  alt="Finance AI"
                />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-4 px-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base ${linkClass(link.href)}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
