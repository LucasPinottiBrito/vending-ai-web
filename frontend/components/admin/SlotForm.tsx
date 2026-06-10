"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { slotSchema } from "@/lib/validators";
import { useEffect } from "react";

type SlotInput = z.input<typeof slotSchema>;
type SlotValues = z.output<typeof slotSchema>;

interface SlotFormProps {
  initialValues?: Partial<SlotValues>;
  onSubmit: (values: SlotValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function SlotForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: SlotFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SlotInput, unknown, SlotValues>({
    resolver: zodResolver(slotSchema) as any,
    defaultValues: {
      code: "",
      motor_id: 0,
      sensor_column_id: 0,
      is_enabled: true,
      ...initialValues,
    },
  });

  const isEnabledValue = watch("is_enabled");

  useEffect(() => {
    if (initialValues) {
      reset({
        code: "",
        motor_id: 0,
        sensor_column_id: 0,
        is_enabled: true,
        ...initialValues,
      });
    }
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código do Slot</Label>
        <Input id="code" placeholder="Ex: A1, B2" {...register("code")} />
        <p className="text-xs text-muted-foreground">Identificador visual no painel da máquina.</p>
        {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="motor_id">Motor ID</Label>
          <Input
            id="motor_id"
            type="number"
            {...register("motor_id", { valueAsNumber: true })}
          />
          {errors.motor_id && <p className="text-sm text-destructive">{errors.motor_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sensor_column_id">Sensor Column ID</Label>
          <Input
            id="sensor_column_id"
            type="number"
            {...register("sensor_column_id", { valueAsNumber: true })}
          />
          {errors.sensor_column_id && <p className="text-sm text-destructive">{errors.sensor_column_id.message}</p>}
        </div>
      </div>

      <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
        <Checkbox
          id="is_enabled"
          checked={isEnabledValue}
          onCheckedChange={(checked) => setValue("is_enabled", checked === true)}
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="is_enabled">Habilitado</Label>
          <p className="text-sm text-muted-foreground">
            Define se o slot está operacional para vendas.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Processando..." : submitLabel}
      </Button>
    </form>
  );
}
