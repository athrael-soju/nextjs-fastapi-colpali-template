"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, FileText } from "lucide-react";

import { register } from "@/components/actions/register-action";
import { useActionState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FieldError, FormError } from "@/components/ui/FormError";

export default function Page() {
  const pathname = usePathname();
  const [state, dispatch] = useActionState(register, undefined);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
              ColPali
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Document Search Platform</p>
        </div>

        <Card className="shadow-xl border border-border bg-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-card-foreground">Welcome</CardTitle>
            <CardDescription className="text-muted-foreground">
              Create a new account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              <div className="flex w-full rounded-lg overflow-hidden border border-border bg-muted">
                <Link 
                  href="/login" 
                  className={`flex-1 py-2 text-center font-medium ${pathname === '/login' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white' : 'text-muted-foreground'}`}
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className={`flex-1 py-2 text-center font-medium ${pathname === '/register' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white' : 'text-muted-foreground'}`}
                >
                  Register
                </Link>
              </div>
              
              <div>
                <form action={dispatch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-card-foreground font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 border-border focus:border-orange-400 focus:ring-orange-400 bg-background text-foreground"
                        required
                      />
                    </div>
                    <FieldError state={state} field="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-card-foreground font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-10 border-border focus:border-orange-400 focus:ring-orange-400 bg-background text-foreground"
                        required
                      />
                    </div>
                    <FieldError state={state} field="password" />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                  >
                    Create Account
                  </Button>
                  <FormError state={state} />
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
