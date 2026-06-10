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
import { machineSchema } from "@/lib/validators";
import { useEffect } from "react";

type MachineInput = z.input<typeof machineSchema>;
type MachineValues = z.output<typeof machineSchema>;

interface MachineFormProps {
  initialValues?: Partial<MachineValues>;
  onSubmit: (values: MachineValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function MachineForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: MachineFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MachineInput, unknown, MachineValues>({
    resolver: zodResolver(machineSchema) as any,
    defaultValues: {
      slug: "",
      name: "",
      location: "",
      status: "OFFLINE",
      ...initialValues,
    },
  });

  const statusValue = watch("status");

  useEffect(() => {
    if (initialValues) {
      reset({
        slug: "",
        name: "",
        location: "",
        status: "OFFLINE",
        ...initialValues,
      });
    }
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Máquina</Label>
        <Input id="name" placeholder="Ex: Máquina Central" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL)</Label>
        <Input id="slug" placeholder="ex: maquina-central" {...register("slug")} />
        <p className="text-xs text-muted-foreground">Identificador único usado no QR Code.</p>
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Localização</Label>
        <Input id="location" placeholder="Ex: Prédio A, 1º Andar" {...register("location")} />
        {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={statusValue} 
          onValueChange={(val) => setValue("status", val as any)}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ONLINE">ONLINE</SelectItem>
            <SelectItem value="OFFLINE">OFFLINE</SelectItem>
            <SelectItem value="MAINTENANCE">MANUTENÇÃO</SelectItem>
            <SelectItem value="ERROR">ERRO</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Processando..." : submitLabel}
      </Button>
    </form>
  );
}
