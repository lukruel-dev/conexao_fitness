import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, CalendarDays, Sparkles, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAvailability,
  saveAvailability,
  generateSlots,
  type AvailabilityBlock,
} from "@/services/availability";
import { listServices } from "@/services/services";

const DAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const MinhaAgenda = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [daysAhead, setDaysAhead] = useState<number>(30);

  const isProvider = user?.role === "PERSONAL" || user?.role === "ACADEMIA";

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
    else if (user && !isProvider) navigate("/");
  }, [isAuthenticated, isProvider, user, navigate]);

  const availabilityQuery = useQuery({
    queryKey: ["availability"],
    queryFn: getAvailability,
    enabled: !!user && isProvider,
  });

  useEffect(() => {
    if (availabilityQuery.data?.availabilities) {
      setBlocks(availabilityQuery.data.availabilities);
    }
  }, [availabilityQuery.data]);

  const servicesQuery = useQuery({
    queryKey: ["my-services", user?.id],
    queryFn: () => listServices(),
    enabled: !!user && isProvider,
    select: (all) => all.filter((s) => s.providerId === user?.id),
  });

  const saveMutation = useMutation({
    mutationFn: () => saveAvailability(blocks),
    onSuccess: () => {
      toast.success("Horários de trabalho salvos!");
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (err: Error) =>
      toast.error("Não foi possível salvar", { description: err.message }),
  });

  const generateMutation = useMutation({
    mutationFn: (serviceId: string) => generateSlots(serviceId, daysAhead),
    onSuccess: (res) =>
      toast.success(`Agenda gerada! ${res.createdCount} vagas criadas.`),
    onError: (err: Error) =>
      toast.error("Falha ao gerar agenda", { description: err.message }),
  });

  const grouped = useMemo(() => {
    const map = new Map<number, AvailabilityBlock[]>();
    for (let d = 0; d < 7; d++) map.set(d, []);
    blocks.forEach((b) => {
      map.get(b.dayOfWeek)?.push(b);
    });
    return map;
  }, [blocks]);

  const addBlock = (dayOfWeek: number) => {
    setBlocks((prev) => [
      ...prev,
      { dayOfWeek, startTime: "08:00", endTime: "12:00" },
    ]);
  };

  const updateBlock = (
    index: number,
    patch: Partial<AvailabilityBlock>,
  ) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    );
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  if (!user || !isProvider) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-40 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Minha <span className="gradient-text">agenda</span>
          </h1>
          <p className="text-muted-foreground mb-6">
            Defina seus dias e horários de trabalho. Depois, gere as vagas
            automaticamente para cada serviço.
          </p>

          {/* Horários de trabalho */}
          <section className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <CalendarDays className="w-6 h-6 text-primary mt-0.5" />
              <div>
                <h2 className="font-display font-bold text-lg">
                  Semana de trabalho
                </h2>
                <p className="text-sm text-muted-foreground">
                  Adicione múltiplos blocos por dia (ex.: manhã e tarde, com
                  intervalo de almoço entre eles).
                </p>
              </div>
            </div>

            {availabilityQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <div className="space-y-4">
                {Array.from({ length: 7 }, (_, day) => {
                  const items = grouped.get(day) ?? [];
                  return (
                    <div
                      key={day}
                      className="border border-border rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display font-semibold">
                          {DAY_LABELS[day]}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBlock(day)}
                        >
                          <Plus className="w-4 h-4" /> Bloco
                        </Button>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Sem horários definidos.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((b) => {
                            const idx = blocks.indexOf(b);
                            return (
                              <div
                                key={idx}
                                className="flex flex-wrap items-end gap-3"
                              >
                                <div>
                                  <Label className="text-xs">Início</Label>
                                  <Input
                                    type="time"
                                    value={b.startTime}
                                    onChange={(e) =>
                                      updateBlock(idx, {
                                        startTime: e.target.value,
                                      })
                                    }
                                    className="w-32"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Fim</Label>
                                  <Input
                                    type="time"
                                    value={b.endTime}
                                    onChange={(e) =>
                                      updateBlock(idx, {
                                        endTime: e.target.value,
                                      })
                                    }
                                    className="w-32"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBlock(idx)}
                                  aria-label="Remover bloco"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Button
                  variant="hero"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar horários"}
                </Button>
              </div>
            )}
          </section>

          {/* Geração de vagas */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-secondary mt-0.5" />
              <div>
                <h2 className="font-display font-bold text-lg">
                  Gerar agenda dos serviços
                </h2>
                <p className="text-sm text-muted-foreground">
                  Aplica seus horários de trabalho ao serviço escolhido,
                  criando as vagas fatiadas conforme a duração. Sobreposições
                  são ignoradas automaticamente.
                </p>
              </div>
            </div>

            <div className="flex items-end gap-3 mb-5">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Dias à frente
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={daysAhead}
                  onChange={(e) =>
                    setDaysAhead(Math.max(1, Number(e.target.value) || 30))
                  }
                  className="w-28"
                />
              </div>
            </div>

            {servicesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Carregando serviços...
              </p>
            ) : !servicesQuery.data || servicesQuery.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Você ainda não tem serviços cadastrados.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {servicesQuery.data.map((s) => (
                  <li
                    key={s.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.modality} · {s.durationMinutes} min
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateMutation.mutate(s.id)}
                      disabled={
                        generateMutation.isPending &&
                        generateMutation.variables === s.id
                      }
                    >
                      {generateMutation.isPending &&
                      generateMutation.variables === s.id
                        ? "Gerando..."
                        : "Gerar vagas"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MinhaAgenda;
