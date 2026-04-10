"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Trash2,
  ShoppingBag,
  Store,
  MoveRight,
  CreditCard,
  ShieldCheck,
  Calendar,
  MapPin,
  ImageIcon,
  MonitorPlay,
  ArrowRight,
} from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Input } from "@/components/primitives/ui/input";
import { Label } from "@/components/primitives/ui/label";
import { Badge } from "@/components/primitives/ui/badge";
import { useCartStore, type CartItem } from "@/lib/cart-store";
import { formatMoney, formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createPurchase } from "@/api/purchases/purchases.post";
import {
  capturePaypalOrder,
  createPaypalOrder,
} from "@/api/paypal/paypal.post";
import { isAxiosError } from "axios";

const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
  currency: "USD",
  intent: "capture" as const,
};

export function CheckoutSection() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const removeLine = useCartStore((s) => s.removeLine);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const { subtotal, discount, total } = useMemo(() => {
    const sub = items.reduce((sum, i) => sum + (i.price ?? 0), 0);
    const tot = items.reduce(
      (sum, i) => sum + (i.totalPrice ?? i.price ?? 0),
      0,
    );
    return { subtotal: sub, discount: sub - tot, total: tot };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center p-6 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-muted/50 mb-6 border border-border/50 shadow-sm">
          <ShoppingBag className="size-10 text-muted-foreground/70" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-3">
          Tu carrito está vacío
        </h2>
        <p className="text-muted-foreground text-lg max-w-md mb-8">
          Aún no has seleccionado ninguna valla. Explora nuestro inventario
          premium y comienza a construir tu campaña.
        </p>
        <Button
          asChild
          size="lg"
          className="h-12 px-8 rounded-full shadow-sm text-base"
        >
          <Link href="/shop">
            <Store className="mr-2 size-5" />
            Explorar inventario
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Checkout
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Revisa las ubicaciones seleccionadas y completa tu reserva.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px] items-start">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h2 className="text-xl font-semibold">Resumen de campaña</h2>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/10 font-medium"
            >
              {items.length} {items.length === 1 ? "ubicación" : "ubicaciones"}
            </Badge>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <CartItemCard
                key={item.lineId}
                item={item}
                onRemove={() => removeLine(item.lineId)}
              />
            ))}
          </div>
        </div>

        <div className="sticky top-28 space-y-6">
          <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
            <div className="h-2 w-full bg-gradient-to-r from-primary/80 to-purple-500/80" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Resumen de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 pb-6 border-b border-border/40">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="tabular-nums">{formatMoney(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Descuentos</span>
                    <span className="tabular-nums">
                      -{formatMoney(discount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Impuestos incluidos</span>
                  <span className="tabular-nums">$0.00</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-dashed border-border/40">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-2xl font-bold tabular-nums text-foreground tracking-tight">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="checkout-email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Contacto de facturación
                </Label>
                <Input
                  id="checkout-email"
                  type="email"
                  autoComplete="email"
                  placeholder="ejemplo@tuempresa.com"
                  className="h-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={email.length > 0 && !emailIsValid}
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Enviaremos los detalles de la reserva y la factura a este
                  correo.
                </p>
              </div>

              <div className="pt-2">
                <div className="overflow-hidden dark:[filter:invert(.935)_hue-rotate(180deg)]">
                  <PayPalScriptProvider options={paypalOptions}>
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        shape: "sharp",
                        color: "white",
                        label: "pay",
                      }}
                      createOrder={async () => {
                        if (!emailIsValid) {
                          setMessage(
                            "Ingresa un correo electrónico corporativo válido.",
                          );
                          throw new Error("Email requerido");
                        }
                        setIsProcessing(true);
                        setMessage(null);
                        try {
                          const data = await createPaypalOrder(items);
                          if (!data.id) {
                            setIsProcessing(false);
                            throw new Error("No se pudo crear la orden");
                          }
                          return data.id;
                        } catch (err) {
                          setIsProcessing(false);
                          throw new Error(
                            paypalApiErrorMessage(
                              err,
                              "No se pudo crear la orden",
                            ),
                          );
                        }
                      }}
                      onApprove={async (data) => {
                        try {
                          await capturePaypalOrder(data.orderID);
                          const purchaseData = await createPurchase({
                            paypalOrderId: data.orderID,
                            email,
                            items,
                          });
                          useCartStore.getState().clear();
                          setIsProcessing(false);
                          // Redirect to shop success page
                          router.push(
                            `/shop/success?purchaseId=${encodeURIComponent(purchaseData.id)}`,
                          );
                        } catch (err: unknown) {
                          setIsProcessing(false);
                          setMessage(
                            `Error al procesar: ${paypalApiErrorMessage(
                              err,
                              "Error desconocido",
                            )}`,
                          );
                        }
                      }}
                      onCancel={() => {
                        setIsProcessing(false);
                        setMessage("El pago ha sido cancelado.");
                      }}
                      onError={(err) => {
                        setIsProcessing(false);
                        setMessage(
                          `Ha ocurrido un error en la pasarela de pago. Intenta nuevamente.`,
                        );
                      }}
                      disabled={items.length === 0 || !emailIsValid}
                    />
                  </PayPalScriptProvider>
                </div>

                {message && (
                  <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium border border-destructive/20">
                    {message}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <CreditCard className="size-4" />
                <span>Pago procesado de forma segura</span>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Garantía B2B
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                Tu reserva de inventario queda asegurada inmediatamente tras el
                pago. Nuestro equipo se contactará para el material gráfico.
              </p>
            </div>
          </div>
          <div className="w-full">
            <Button
              variant="default"
              className="w-full"
              onClick={() => router.push("/shop")}
            >
              Agregar más vallas
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function paypalApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { error?: string } | undefined;
    if (body?.error) return body.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function CartItemCard({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: () => void;
}) {
  const isDigital = item.kind === "digital";

  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 rounded-2xl border border-border/50 bg-card p-4 transition-all hover:shadow-md hover:border-border">
      {/* Icon or Image representation */}
      <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/40">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.reference ?? "Valla"}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900">
            {isDigital ? (
              <MonitorPlay className="size-8 text-zinc-400 dark:text-zinc-600" />
            ) : (
              <ImageIcon className="size-8 text-zinc-400 dark:text-zinc-600" />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
        {/* Info */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "font-medium border-transparent shadow-sm text-[10px] uppercase tracking-wider",
                isDigital
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              )}
            >
              {isDigital ? "Digital" : "Estática"}
            </Badge>
            <span className="font-semibold text-sm">
              {item.billboardCode ?? "Sin Código"}
            </span>
          </div>

          <h3 className="text-base font-medium leading-tight truncate text-foreground">
            {item.reference ?? item.address ?? "Ubicación sin referencia"}
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground mt-1">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {item.departmentName ??
                  item.address ??
                  "Ubicación no especificada"}
              </span>
            </div>

            <div className="hidden sm:block size-1 rounded-full bg-border" />

            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              <span>{formatDateRange(item.from, item.to)}</span>
            </div>

            {isDigital && "spotCount" in item && (
              <>
                <div className="hidden sm:block size-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5">
                  <MonitorPlay className="size-3.5 shrink-0" />
                  <span>{item.spotCount} spots/hora</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
          <div className="flex flex-col sm:items-end">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Inversión
            </span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatMoney(item.totalPrice ?? item.price)}
            </span>
            {item.totalPrice != null && item.totalPrice < item.price && (
              <span className="text-xs tabular-nums line-through text-muted-foreground text-red-500">
                {formatMoney(item.price)}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2"
          >
            <Trash2 className="size-4 mr-1.5" />
            <span className="text-xs">Quitar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
