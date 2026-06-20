import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "../components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form"
import { Input } from "../components/ui/input"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

interface LoginProps {
  onLogin: () => void;
  onNavigateToSignUp: () => void;
  successMessage?: string;
}

export default function Login({ onLogin, onNavigateToSignUp, successMessage }: LoginProps) {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(values: z.infer<typeof loginSchema>) {
    // Dummy authentication
    localStorage.setItem("docpulse_auth", JSON.stringify({ isAuthenticated: true }))
    onLogin()
  }

  return (
    <div className="flex min-h-screen bg-syn-surface text-syn-onSurface font-sans">
      {/* Left Panel: Auth Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-1/2 lg:px-24 relative overflow-hidden">
        
        {/* Subtle background gradient pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 10% 20%, rgba(0, 86, 197, 0.04) 0%, transparent 60%),
                              radial-gradient(circle at 90% 80%, rgba(20, 110, 241, 0.03) 0%, transparent 60%)`,
          }}
        />

        <div className="mx-auto w-full max-w-sm relative z-10">
          <div className="mb-10">
            {/* Logo text removed */}
            <h2 className="text-3xl font-serif font-semibold tracking-tight text-syn-onSurface mb-2">
              Welcome to DocPulse
            </h2>
            <p className="text-syn-onSurfaceVariant/80 text-sm">
              Sign in to start chatting with your documents
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 rounded-soft-sm bg-syn-primaryContainer/20 border border-syn-primary/30 p-3 text-sm text-syn-primary font-medium text-center">
              {successMessage}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-center text-sm text-syn-onSurfaceVariant">
            Don't have an account?{" "}
            <button 
              onClick={onNavigateToSignUp}
              className="text-syn-primary font-semibold hover:underline"
            >
              Sign up
            </button>
          </p>

          <p className="mt-6 text-center text-xs text-syn-outline">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {/* Right Panel: Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-syn-surfaceContainerHigh">
        <img
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop"
          alt="Clean modern workspace"
          className="h-full w-full object-cover object-center"
        />
        {/* Soft overlay to blend with theme */}
        <div className="absolute inset-0 bg-syn-primary/10 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-syn-surface/80 to-transparent" />
      </div>
    </div>
  )
}
