"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Building2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  upsertDepartment,
  deleteDepartment,
  upsertEventCategory,
  deleteEventCategory,
} from "@/actions/settings";

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
  description: string | null;
  isActive: boolean;
}

interface Props {
  settings: AppSetting[];
  departments: Department[];
  categories: Category[];
}

const deptSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().min(4, "Color is required"),
  description: z.string().optional(),
});

type DeptForm = z.infer<typeof deptSchema>;
type CategoryForm = z.infer<typeof categorySchema>;

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#0ea5e9", "#84cc16", "#f43f5e",
];

export function SettingsDashboard({ settings, departments: initialDepts, categories: initialCats }: Props) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepts);
  const [categories, setCategories] = useState(initialCats);
  const [deptDialog, setDeptDialog] = useState<{ open: boolean; editing?: Department }>({ open: false });
  const [catDialog, setCatDialog] = useState<{ open: boolean; editing?: Category }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<{ type: "dept" | "cat"; id: string; name: string } | null>(null);

  const deptForm = useForm<DeptForm>({ resolver: zodResolver(deptSchema) });
  const catForm = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) });

  const openDeptDialog = (dept?: Department) => {
    deptForm.reset({ name: dept?.name ?? "", description: dept?.description ?? "" });
    setDeptDialog({ open: true, editing: dept });
  };

  const openCatDialog = (cat?: Category) => {
    catForm.reset({ name: cat?.name ?? "", color: cat?.color ?? "#3b82f6", description: cat?.description ?? "" });
    setCatDialog({ open: true, editing: cat });
  };

  const handleDeptSubmit = async (data: DeptForm) => {
    const result = await upsertDepartment({ ...data, id: deptDialog.editing?.id });
    if (result.success && result.data) {
      if (deptDialog.editing) {
        setDepartments((p) => p.map((d) => d.id === result.data!.id ? result.data! : d));
        toast.success("Department updated");
      } else {
        setDepartments((p) => [...p, result.data!]);
        toast.success("Department created");
      }
      setDeptDialog({ open: false });
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to save department");
    }
  };

  const handleCatSubmit = async (data: CategoryForm) => {
    const result = await upsertEventCategory({ ...data, id: catDialog.editing?.id });
    if (result.success && result.data) {
      if (catDialog.editing) {
        setCategories((p) => p.map((c) => c.id === result.data!.id ? result.data! : c));
        toast.success("Category updated");
      } else {
        setCategories((p) => [...p, result.data!]);
        toast.success("Category created");
      }
      setCatDialog({ open: false });
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to save category");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const fn = deleteTarget.type === "dept" ? deleteDepartment : deleteEventCategory;
    const result = await fn(deleteTarget.id);
    if (result.success) {
      if (deleteTarget.type === "dept") {
        setDepartments((p) => p.filter((d) => d.id !== deleteTarget.id));
      } else {
        setCategories((p) => p.filter((c) => c.id !== deleteTarget.id));
      }
      toast.success("Deleted successfully");
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage departments, event categories, and system configuration
        </p>
      </div>

      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments">
            <Building2 className="mr-2 h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="mr-2 h-4 w-4" />
            Event Categories
          </TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Departments */}
        <TabsContent value="departments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base">Departments</CardTitle>
                <CardDescription>Manage organizational departments</CardDescription>
              </div>
              <Button size="sm" onClick={() => openDeptDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium text-sm">{dept.name}</p>
                      {dept.description && (
                        <p className="text-xs text-muted-foreground">{dept.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={dept.isActive ? "secondary" : "outline"}>
                        {dept.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDeptDialog(dept)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ type: "dept", id: dept.id, name: dept.name })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base">Event Categories</CardTitle>
                <CardDescription>Organize events by type</CardDescription>
              </div>
              <Button size="sm" onClick={() => openCatDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <p className="font-medium text-sm">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cat.isActive ? "secondary" : "outline"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCatDialog(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ type: "cat", id: cat.id, name: cat.name })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System */}
        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Settings</CardTitle>
              <CardDescription>Application configuration values</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {settings.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-4 px-6 py-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm font-mono">{s.key}</p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                      )}
                    </div>
                    <p className="text-sm text-right max-w-xs truncate">{s.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Department Dialog */}
      <Dialog open={deptDialog.open} onOpenChange={(o) => !o && setDeptDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{deptDialog.editing ? "Edit Department" : "Add Department"}</DialogTitle>
          </DialogHeader>
          <Form {...deptForm}>
            <form onSubmit={deptForm.handleSubmit(handleDeptSubmit)} className="space-y-4">
              <FormField
                control={deptForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} placeholder="Department name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={deptForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl><Input {...field} placeholder="Short description" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDeptDialog({ open: false })}>
                  Cancel
                </Button>
                <Button type="submit" disabled={deptForm.formState.isSubmitting}>
                  {deptForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {deptDialog.editing ? "Save Changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialog.open} onOpenChange={(o) => !o && setCatDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{catDialog.editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <Form {...catForm}>
            <form onSubmit={catForm.handleSubmit(handleCatSubmit)} className="space-y-4">
              <FormField
                control={catForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} placeholder="Category name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={catForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl><Input {...field} placeholder="Short description" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={catForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className="h-7 w-7 rounded-full border-2 transition-all"
                              style={{
                                backgroundColor: c,
                                borderColor: field.value === c ? "hsl(var(--foreground))" : "transparent",
                                transform: field.value === c ? "scale(1.15)" : "scale(1)",
                              }}
                              onClick={() => field.onChange(c)}
                            />
                          ))}
                        </div>
                        <Input type="color" {...field} className="w-24 h-8 p-0.5 cursor-pointer" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCatDialog({ open: false })}>
                  Cancel
                </Button>
                <Button type="submit" disabled={catForm.formState.isSubmitting}>
                  {catForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {catDialog.editing ? "Save Changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the {deleteTarget?.type === "dept" ? "department" : "category"}.
              Existing records will not be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
