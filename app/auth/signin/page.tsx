"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Facebook } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            Creative Analytics
          </CardTitle>
          <CardDescription className="text-lg">
            Analysez la performance de vos créatives Meta Ads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
          >
            <Facebook className="mr-2" />
            Se connecter avec Facebook
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Connexion sécurisée via Facebook OAuth pour accéder à vos données
            Meta Ads
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
