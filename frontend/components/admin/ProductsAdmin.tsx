"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import {
  Edit,
  FileUp,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  FilterX,
  Package,
} from "lucide-react";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, apiUpload, getErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { productSchema } from "@/lib/validators";
import { ProductForm } from "./ProductForm";

type Product = {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  price_cents: number;
  image_url?: string;
  image_path?: string;
  is_active: boolean;
};

type ProductValues = z.infer<typeof productSchema>;

export function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  ) as string[];

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (status !== "all") queryParams.append("status", status);
      if (category !== "all") queryParams.append("category", category);

      const response = await apiRequest<{ products: Product[] }>(
        `/api/products?${queryParams.toString()}`,
      );
      setProducts(response.data.products);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [search, status, category]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(values: ProductValues) {
    setIsSubmitting(true);
    try {
      await apiRequest("/api/products", { method: "POST", body: values });
      toast.success("Produto criado com sucesso!");
      setIsCreateOpen(false);
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(values: ProductValues) {
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        body: values,
      });
      toast.success("Produto atualizado com sucesso!");
      setEditingProduct(null);
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(product: Product) {
    try {
      await apiRequest(`/api/products/${product.id}`, {
        method: "PUT",
        body: { ...product, is_active: !product.is_active },
      });
      toast.success(
        `Produto ${product.is_active ? "desativado" : "ativado"} com sucesso!`,
      );
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja desativar este produto?")) return;
    try {
      await apiRequest(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Produto desativado");
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  }

  async function handleUploadImage(productId: number, file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.set("image", file);

    const promise = apiUpload(`/api/products/${productId}/image`, formData);

    toast.promise(promise, {
      loading: "Enviando imagem...",
      success: () => {
        load();
        return "Imagem enviada com sucesso!";
      },
      error: (err) => getErrorMessage(err),
    });
  }

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setCategory("all");
  };

  const resolveImageUrl = (product: Product) => {
    if (product.image_url) return product.image_url;
    if (product.image_path) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      return `${apiUrl}${product.image_path}`;
    }
    return null;
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Produtos"
            description="Gerencie o catálogo de produtos e imagens."
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha as informações para adicionar um novo item ao catálogo.
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                onSubmit={handleCreate}
                isSubmitting={isSubmitting}
                submitLabel="Criar Produto"
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Nome ou SKU</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Ex: Coca-Cola..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-[180px] space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[180px] space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={clearFilters}>
                <FilterX className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && products.length === 0 ? (
          <LoadingState label="Carregando produtos..." />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Imagem</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Nenhum produto encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => {
                        const imageUrl = resolveImageUrl(product);
                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="relative h-10 w-10 overflow-hidden rounded border bg-muted">
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={product.name}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {product.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {product.sku}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {product.category || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(product.price_cents)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  product.is_active ? "secondary" : "destructive"
                                }
                                className="cursor-pointer"
                                onClick={() => toggleStatus(product)}
                              >
                                {product.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <label className="cursor-pointer">
                                  <Input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleUploadImage(
                                        product.id,
                                        e.target.files?.[0] || null,
                                      )
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    title="Upload Imagem"
                                  >
                                    <div>
                                      <FileUp className="h-4 w-4" />
                                    </div>
                                  </Button>
                                </label>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Ações
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setEditingProduct(product)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDelete(product.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Desativar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Altere as informações do produto selecionado.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              initialValues={{
                sku: editingProduct.sku,
                name: editingProduct.name,
                description: editingProduct.description,
                category: editingProduct.category,
                price_cents: editingProduct.price_cents,
                is_active: editingProduct.is_active,
              }}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
              submitLabel="Salvar Alterações"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
