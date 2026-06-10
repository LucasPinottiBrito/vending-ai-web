"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inventorySchema } from "@/lib/validators";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type InventoryInput = z.input<typeof inventorySchema>;
type InventoryValues = z.output<typeof inventorySchema>;

interface InventoryFormProps {
  initialValues?: Partial<InventoryValues>;
  onSubmit: (values: InventoryValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

type Machine = { id: number; name: string };
type Slot = { id: number; code: string; machine_id: number };
type Product = { id: number; name: string };

export function InventoryForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: InventoryFormProps) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InventoryValues>({
    resolver: zodResolver(inventorySchema) as any,
    defaultValues: {
      machine_id: 0,
      slot_id: 0,
      product_id: 0,
      quantity_available: 0,
      quantity_reserved: 0,
      min_quantity_alert: 5,
      ...initialValues,
    },
  });

  const selectedMachineId = watch("machine_id");
  const selectedSlotId = watch("slot_id");
  const selectedProductId = watch("product_id");

  useEffect(() => {
    async function loadData() {
      try {
        const [machinesRes, productsRes] = await Promise.all([
          apiRequest<{ machines: Machine[] }>("/api/machines", { query: { active: "active" } }),
          apiRequest<{ products: Product[] }>("/api/products", { query: { status: "active" } }),
        ]);
        setMachines(machinesRes.data.machines);
        setProducts(productsRes.data.products);
      } catch (err) {
        console.error("Failed to load inventory form data", err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMachineId > 0) {
      apiRequest<{ slots: Slot[] }>(`/api/machines/${selectedMachineId}/slots`)
        .then((res) => setAllSlots(res.data.slots))
        .catch(() => setAllSlots([]));
    } else {
      setAllSlots([]);
    }
  }, [selectedMachineId]);

  useEffect(() => {
    if (initialValues) {
      reset({
        machine_id: 0,
        slot_id: 0,
        product_id: 0,
        quantity_available: 0,
        quantity_reserved: 0,
        min_quantity_alert: 5,
        ...initialValues,
      });
    }
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="machine_id">Máquina</Label>
        <Select
          onValueChange={(val) => setValue("machine_id", parseInt(val))}
          value={selectedMachineId ? selectedMachineId.toString() : ""}
        >
          <SelectTrigger id="machine_id">
            <SelectValue placeholder="Selecione a máquina" />
          </SelectTrigger>
          <SelectContent>
            {machines.map((m) => (
              <SelectItem key={m.id} value={m.id.toString()}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.machine_id && <p className="text-sm text-destructive">{errors.machine_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slot_id">Slot</Label>
        <Select
          onValueChange={(val) => setValue("slot_id", parseInt(val))}
          value={selectedSlotId ? selectedSlotId.toString() : ""}
          disabled={!selectedMachineId}
        >
          <SelectTrigger id="slot_id">
            <SelectValue placeholder={selectedMachineId ? "Selecione o slot" : "Selecione uma máquina primeiro"} />
          </SelectTrigger>
          <SelectContent>
            {allSlots.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.slot_id && <p className="text-sm text-destructive">{errors.slot_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_id">Produto</Label>
        <Select
          onValueChange={(val) => setValue("product_id", parseInt(val))}
          value={selectedProductId ? selectedProductId.toString() : ""}
        >
          <SelectTrigger id="product_id">
            <SelectValue placeholder="Selecione o produto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.product_id && <p className="text-sm text-destructive">{errors.product_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity_available">Qtd. Disponível</Label>
          <Input
            id="quantity_available"
            type="number"
            {...register("quantity_available", { valueAsNumber: true })}
          />
          {errors.quantity_available && <p className="text-sm text-destructive">{errors.quantity_available.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_quantity_alert">Alerta Mínimo</Label>
          <Input
            id="min_quantity_alert"
            type="number"
            {...register("min_quantity_alert", { valueAsNumber: true })}
          />
          {errors.min_quantity_alert && <p className="text-sm text-destructive">{errors.min_quantity_alert.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Processando..." : submitLabel}
      </Button>
    </form>
  );
}
