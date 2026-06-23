"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changePassword } from "@/actions/password";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await changePassword(data);
      if (result.success) {
        toast.success("Password changed successfully");
        form.reset();
      } else {
        if (result.fieldErrors) {
          for (const [field, errors] of Object.entries(result.fieldErrors) as [string, string[]][]) {
            form.setError(field as keyof FormValues, { message: errors[0] });
          }
        } else {
          toast.error(result.error ?? "Failed to change password");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const PasswordInput = ({
    name,
    label,
    visible,
    onToggle,
  }: {
    name: keyof FormValues;
    label: string;
    visible: boolean;
    onToggle: () => void;
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={visible ? "text" : "password"}
                autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
                {...field}
              />
              <button
                type="button"
                onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PasswordInput
              name="currentPassword"
              label="Current Password"
              visible={show.current}
              onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
            />
            <PasswordInput
              name="newPassword"
              label="New Password"
              visible={show.next}
              onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
            />
            <PasswordInput
              name="confirmPassword"
              label="Confirm New Password"
              visible={show.confirm}
              onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
            />
            <p className="text-xs text-muted-foreground">
              Must be 8+ characters with an uppercase letter, number, and special character.
            </p>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
