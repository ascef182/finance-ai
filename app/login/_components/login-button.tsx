"use client";
import { SignInButton } from "@clerk/nextjs";
import { LogInIcon } from "lucide-react";

import { Button } from "../../_components/ui/button";

export function LoginButton() {
  return (
    <SignInButton>
      <Button variant="outline">
        <LogInIcon className="mr-2" />
        Fazer login ou criar conta
      </Button>
    </SignInButton>
  );
}
