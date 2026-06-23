"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ImageIcon, X, Upload } from "lucide-react";
import { proxyUrl } from "@/lib/proxy-url";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createEvent, updateEvent } from "@/actions/events";

const formSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    location: z.string().min(1, "Location is required"),
    address: z.string().optional(),
    minVolunteers: z.coerce.number().min(1).max(100),
    organizerId: z.string().min(1, "Organizer is required"),
    notes: z.string().optional(),
    coverImage: z.string().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type FormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  categories: { id: string; name: string; color: string }[];
  employees: { id: string; firstName: string; lastName: string; jobTitle: string }[];
  defaultValues?: Partial<FormValues>;
  eventId?: string;
  currentCoverImage?: string | null;
}

export function EventForm({
  categories,
  employees,
  defaultValues,
  eventId,
  currentCoverImage,
}: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!eventId;

  // Cover image state
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(currentCoverImage ?? null);

  useEffect(() => {
    if (!coverFile) { setCoverPreview(null); return; }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      date: "",
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      address: "",
      minVolunteers: 4,
      organizerId: "",
      notes: "",
      ...defaultValues,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Upload cover image first if a new one was selected
      let coverImageUrl = existingCover ?? undefined;
      if (coverFile) {
        const form = new FormData();
        form.append("file", coverFile);
        const res = await fetch("/api/upload-cover", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Cover image upload failed"); return; }
        coverImageUrl = json.url as string;
      }

      let result;
      if (isEditing) {
        result = await updateEvent(eventId, { ...data, coverImage: coverImageUrl });
      } else {
        result = await createEvent({ ...data, coverImage: coverImageUrl });
      }

      if (result.success) {
        toast.success(isEditing ? "Event updated!" : "Event created!");
        if (!isEditing && result.data) {
          router.push(`/events/${result.data.id}`);
        } else {
          router.push(`/events/${eventId}`);
        }
      } else {
        toast.error(result.error ?? "Failed to save event");
        if (result.fieldErrors) {
          for (const [field, errors] of Object.entries(result.fieldErrors) as [string, string[]][]) {
            form.setError(field as keyof FormValues, { message: errors[0] });
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayCover = coverPreview ?? (existingCover ? proxyUrl(existingCover) : null);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cover Image</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setCoverFile(f); setExistingCover(null); }
              }}
            />
            {displayCover ? (
              <div className="relative rounded-xl overflow-hidden border aspect-video w-full max-w-md">
                <img src={displayCover} alt="Cover" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium shadow"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); setExistingCover(null); }}
                    className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium shadow text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 w-full max-w-md aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload cover image</p>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, GIF, WEBP · Max 10 MB</p>
                </div>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Lincoln Elementary Fire Safety Day" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the event..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizer</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organizer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.firstName} {e.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lincoln Elementary School" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, State 00000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Volunteers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volunteer Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="minVolunteers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Volunteers Needed</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      className="w-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum volunteers needed — more can always sign up
                  </FormDescription>
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
                      placeholder="Any special instructions or notes for volunteers..."
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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none sm:w-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Event"
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
      </form>
    </Form>
  );
}
