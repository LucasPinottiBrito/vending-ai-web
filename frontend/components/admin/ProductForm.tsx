"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { productSchema } from "@/lib/validators";
import { useEffect } from "react";

type ProductInput = z.input<typeof productSchema>;
type ProductValues = z.output<typeof productSchema>;

interface ProductFormProps {
  initialValues?: Partial<ProductValues>;
  onSubmit: (values: ProductValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function ProductForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductInput, unknown, ProductValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      category: "",
      price_cents: 0,
      is_active: true,
      ...initialValues,
    },
  });

  const isActiveValue = watch("is_active");

  useEffect(() => {
    if (initialValues) {
      reset({
        sku: "",
        name: "",
        description: "",
        category: "",
        price_cents: 0,
        is_active: true,
        ...initialValues,
      });
    }
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" placeholder="PROD-001" {...register("sku")} />
          {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" placeholder="Bebidas" {...register("category")} />
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome do Produto</Label>
        <Input id="name" placeholder="Coca-Cola 350ml" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descrição opcional do produto..."
          className="resize-none"
          {...register("description")}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price_cents">Preço (Centavos)</Label>
        <Input
          id="price_cents"
          type="number"
          placeholder="500 para R$ 5,00"
          {...register("price_cents", { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">Informe o valor inteiro em centavos.</p>
        {errors.price_cents && <p className="text-sm text-destructive">{errors.price_cents.message}</p>}
      </div>

      <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
        <Checkbox
          id="is_active"
          checked={isActiveValue}
          onCheckedChange={(checked) => setValue("is_active", checked === true)}
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="is_active">Ativo</Label>
          <p className="text-sm text-muted-foreground">
            Define se o produto estará visível para venda.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Processando..." : submitLabel}
      </Button>
    </form>
  );
}
