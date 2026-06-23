"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AVATAR_COLORS } from "@/lib/utils";
import { createEmployee, updateEmployee } from "@/actions/employees";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  departmentId: z.string().min(1, "Department is required"),
  status: z.enum(["AVAILABLE", "BUSY", "VACATION", "SICK", "TRAINING", "INACTIVE"]),
  avatarColor: z.string(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Department {
  id: string;
  name: string;
}

interface EmployeeFormProps {
  departments: Department[];
  defaultValues?: Partial<FormValues>;
  employeeId?: string;
}

export function EmployeeForm({
  departments,
  defaultValues,
  employeeId,
}: EmployeeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!employeeId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      departmentId: "",
      status: "AVAILABLE",
      avatarColor: AVATAR_COLORS[0],
      notes: "",
      ...defaultValues,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      let result;
      if (isEditing) {
        result = await updateEmployee(employeeId, data);
      } else {
        result = await createEmployee(data);
      }

      if (result.success) {
        toast.success(isEditing ? "Employee updated" : "Employee created");
        if (!isEditing && result.data) {
          router.push(`/employees/${result.data.id}`);
        } else {
          router.push(`/employees/${employeeId}`);
        }
      } else {
        toast.error(result.error ?? "An error occurred");
        if (result.fieldErrors) {
          for (const [field, errors] of Object.entries(result.fieldErrors) as [string, string[]][]) {
            form.setError(field as keyof FormValues, {
              message: errors[0],
            });
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["AVAILABLE", "BUSY", "VACATION", "SICK", "TRAINING", "INACTIVE"].map(
                        (s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.smith@department.gov"
                      disabled={isEditing}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Community Educator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Avatar Color Picker */}
            <FormField
              control={form.control}
              name="avatarColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar Color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`h-8 w-8 rounded-full transition-all ${
                            field.value === color
                              ? "ring-2 ring-offset-2 ring-primary scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none sm:w-40">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Employee"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        {!isEditing && (
          <p className="text-xs text-muted-foreground">
            The employee will receive a temporary password: <code>TempPass@123!</code>. They should change it on first login.
          </p>
        )}
      </form>
    </Form>
  );
}
