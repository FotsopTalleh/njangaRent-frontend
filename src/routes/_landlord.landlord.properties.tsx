// Landlord Properties — Supabase-backed (properties table)
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Building2, MapPin, Users, Loader2, Trash2, MoreHorizontal, AlertCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_landlord/landlord/properties")({
  head: () => ({ meta: [{ title: "Properties — NjangaRent" }] }),
  component: PropertiesPage,
});

const propertySchema = z.object({
  name:          z.string().min(2, "Property name is required"),
  address:       z.string().min(4, "Address is required"),
  city:          z.string().min(2, "City is required"),
  propertyType:  z.enum(["apartment", "studio", "house", "room", "villa", "office"]),
  totalUnits:    z.coerce.number().min(1).max(500),
});
type PropertyForm = z.infer<typeof propertySchema>;

const TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  studio: "Studio",
  house: "House",
  room: "Room",
  villa: "Villa",
  office: "Office",
};

function PropertiesPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: { propertyType: "apartment", totalUnits: 1 },
  });

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["properties", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const addMut = useMutation({
    mutationFn: async (form: PropertyForm) => {
      const { error } = await supabase.from("properties").insert({
        landlord_id: user?.id,
        name: form.name,
        address: form.address,
        city: form.city,
        property_type: form.propertyType,
        total_units: form.totalUnits,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Property added");
      setAddOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Property removed");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const properties = data as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">{properties.length} properties registered.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Add property
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load properties: {(error as Error).message}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && properties.length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No properties yet</p>
          <p className="text-xs mt-1">Add your first property to start managing tenants.</p>
          <Button onClick={() => setAddOpen(true)} className="mt-4 rounded-xl gap-2">
            <Plus className="h-4 w-4" /> Add property
          </Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive gap-2"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete property
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <p className="font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {p.address}, {p.city}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="rounded-full text-xs">
                {TYPE_LABELS[p.property_type] ?? p.property_type}
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs gap-1">
                <Users className="h-3 w-3" /> {p.total_units ?? 1} units
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Add Property Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Property</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => addMut.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prop-name">Property name</Label>
              <Input id="prop-name" placeholder="e.g. Bonduma Apartments Block A" className="rounded-xl" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prop-address">Address</Label>
              <Input id="prop-address" placeholder="Street address" className="rounded-xl" {...register("address")} />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prop-city">City</Label>
                <Input id="prop-city" placeholder="Buea" className="rounded-xl" {...register("city")} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue="apartment" onValueChange={(v) => setValue("propertyType", v as any)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prop-units">Total units</Label>
              <Input id="prop-units" type="number" min={1} className="rounded-xl" {...register("totalUnits")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={addMut.isPending} className="rounded-xl">
                {addMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Property"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground rounded-xl"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
