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

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

interface SignUpProps {
  onSignUp: () => void;
  onNavigateToLogin: () => void;
}

export default function SignUp({ onSignUp, onNavigateToLogin }: SignUpProps) {
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  function onSubmit(values: z.infer<typeof signUpSchema>) {
    // Dummy authentication - redirect back to login instead of logging in
    onSignUp()
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
            {/* Logo text removed per user request */}
            <h2 className="text-3xl font-serif font-semibold tracking-tight text-syn-onSurface mb-2">
              Create an account
            </h2>
            <p className="text-syn-onSurfaceVariant/80 text-sm">
              Sign up to start chatting with your documents
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                Sign Up
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-center text-sm text-syn-onSurfaceVariant">
            Already have an account?{" "}
            <button 
              onClick={onNavigateToLogin}
              className="text-syn-primary font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>

          <p className="mt-6 text-center text-xs text-syn-outline">
            By signing up, you agree to our Terms of Service and Privacy Policy.
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
