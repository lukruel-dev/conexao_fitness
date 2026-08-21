import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listServices } from "@/services/services";
import { formatBRL } from "@/lib/format";
import { MapPin, Search, Star, Clock, LocateFixed, Loader2, BadgeCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const modalityOptions = ["Todos", "Musculação", "Funcional", "CrossFit", "Yoga", "Pilates"];
const typeOptions: { value: "" | "PERSONAL" | "ACADEMIA"; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "ACADEMIA", label: "Academias" },
  { value: "PERSONAL", label: "Personal Trainers" },
];

const radiusOptions: { value: number | undefined; label: string }[] = [
  { value: undefined, label: "Qualquer distância" },
  { value: 5, label: "Até 5 km" },
  { value: 10, label: "Até 10 km" },
  { value: 25, label: "Até 25 km" },
  { value: 50, label: "Até 50 km" },
];

const Buscar = () => {
  const [q, setQ] = useState("");
  const [modality, setModality] = useState("Todos");
  const [providerType, setProviderType] = useState<"" | "PERSONAL" | "ACADEMIA">("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | undefined>(undefined);
  const [geoLoading, setGeoLoading] = useState(false);

  const URUGUAIANA_COORDS = { lat: -29.7578, lng: -57.0872 };

  const requestGeolocation = async (silent = false) => {
    if (coords && !silent) {
      // Se já possui coords ativas e o usuário clicou de novo, desativa
      setCoords(null);
      setRadiusKm(undefined);
      toast({ title: "Filtro de localização removido", description: "Mostrando todos os serviços sem restrição de distância." });
      return;
    }

    setGeoLoading(true);

    try {
      // Se estiver executando como app nativo (Capacitor no Android / iOS)
      if (Capacitor.isNativePlatform()) {
        let permStatus = await Geolocation.checkPermissions();

        // Solicitar permissão nativa se não concedida
        if (permStatus.location !== "granted" && permStatus.coarseLocation !== "granted") {
          permStatus = await Geolocation.requestPermissions();
        }

        if (permStatus.location === "granted" || permStatus.coarseLocation === "granted") {
          let position;
          try {
            position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5 * 60 * 1000,
            });
          } catch (highAccErr) {
            // Fallback: se alta precisão (GPS de satélite) falhar/expirar em ambiente fechado, usa rede/Wi-Fi
            position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: false,
              timeout: 12000,
              maximumAge: 5 * 60 * 1000,
            });
          }

          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setGeoLoading(false);
          if (!silent) toast({ title: "Localização ativada!", description: "Mostrando serviços próximos à sua posição." });
          return;
        } else {
          setGeoLoading(false);
          setCoords(URUGUAIANA_COORDS);
          if (!silent) {
            toast({
              title: "Permissão de GPS Negada",
              description: "Para usar sua localização, permita o acesso no celular ou ative nas Configurações.",
            });
          }
          return;
        }
      }

      // Executando no navegador Web
      if (!("geolocation" in navigator)) {
        setCoords(URUGUAIANA_COORDS);
        setGeoLoading(false);
        if (!silent) toast({ title: "Localização Padrão", description: "Geolocalização não suportada neste navegador. Usando Uruguaiana - RS como referência." });
        return;
      }

      // Verificar se a origem é segura em testes móveis
      const isSecure = window.isSecureContext || window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (!isSecure) {
        setCoords(URUGUAIANA_COORDS);
        setGeoLoading(false);
        if (!silent) {
          toast({
            title: "Conexão Não Segura (HTTP)",
            description: "No celular via navegador, a localização exige HTTPS. No app instalado funciona nativamente.",
          });
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoLoading(false);
          if (!silent) toast({ title: "Localização ativada!", description: "Mostrando serviços próximos à sua posição." });
        },
        (err) => {
          setGeoLoading(false);
          setCoords(URUGUAIANA_COORDS);
          if (!silent) {
            let desc = "Não foi possível obter GPS. Usando Uruguaiana - RS como referência.";
            if (err.code === err.PERMISSION_DENIED) {
              desc = "Permissão de GPS negada. Permita o acesso nas configurações do celular.";
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              desc = "Sinal de GPS indisponível. Verifique se o GPS está ativado no celular.";
            } else if (err.code === err.TIMEOUT) {
              desc = "Tempo limite para obter localização excedido. Tente novamente.";
            }
            toast({
              title: "Localização Padrão Ativada",
              description: desc,
            });
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 }
      );
    } catch (err) {
      setGeoLoading(false);
      setCoords(URUGUAIANA_COORDS);
      if (!silent) {
        toast({
          title: "Localização Padrão Ativada",
          description: "Não foi possível acessar a localização nativa. Usando Uruguaiana - RS.",
        });
      }
    }
  };

  // Auto-tenta uma vez ao montar (silencioso)
  useEffect(() => {
    if (navigator && navigator.permissions && typeof navigator.permissions.query === "function") {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (status.state === "granted") {
            requestGeolocation(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", { q, modality, providerType, coords, radiusKm }],
    queryFn: () =>
      listServices({
        q: q || undefined,
        modality: modality !== "Todos" ? modality : undefined,
        providerType: providerType || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm: coords ? radiusKm : undefined,
      }),
  });


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Encontre seu <span className="gradient-text">treino</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{coords ? "Filtrando por localização" : "Uruguaiana, RS (e região)"}</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 mb-6 shadow-card">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Buscar academia, personal trainer ou modalidade"
                  placeholder="Buscar academia, personal..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-xs sm:text-sm placeholder:text-xs placeholder:sm:text-sm min-w-0 flex-1"
                />
              </div>
              <Button
                type="button"
                variant={coords ? "success" : "outline"}
                size="default"
                onClick={() => requestGeolocation(false)}
                disabled={geoLoading}
                aria-label="Usar minha localização"
                className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 h-11 text-xs sm:text-sm font-medium px-3 sm:px-4 max-w-full overflow-hidden"
              >
                {geoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <LocateFixed className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">
                  {coords ? "Localização ativa (remover)" : "Perto de mim"}
                </span>
              </Button>
            </div>

            {coords && (
              <div className="flex flex-wrap gap-2 mt-3 items-center">
                <span className="text-xs text-muted-foreground mr-1">Raio:</span>
                {radiusOptions.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setRadiusKm(r.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      radiusKm === r.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}


            {/* Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {typeOptions.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setProviderType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    providerType === t.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <div className="w-px bg-border mx-1" />
              {modalityOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setModality(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    modality === m
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <div className="grid gap-4">
              {services.map((s) => (
                <Link
                  key={s.id}
                  to={`/servico/${s.id}`}
                  className={`relative block bg-card rounded-2xl p-5 transition-all ${
                    s.isPremium
                      ? "border-2 border-yellow-400 shadow-[0_0_0_4px_rgba(250,204,21,0.12)] hover:shadow-[0_0_0_6px_rgba(250,204,21,0.18)]"
                      : "border border-border hover:border-primary/40 hover:shadow-card"
                  }`}
                >
                  {s.isPremium && (
                    <span className="absolute -top-2 left-4 flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      <BadgeCheck className="w-3 h-3" />
                      DESTAQUE
                    </span>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      {/* Provider Image */}
                      <div className="shrink-0 flex items-start mt-1">
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-secondary shadow-[0_0_10px_rgba(45,212,191,0.3)]">
                          <img 
                            src={s.providerAvatar || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop"} 
                            alt={s.providerName || "Profissional"} 
                            className="w-full h-full rounded-full object-cover border-2 border-background"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              s.providerType === "ACADEMIA"
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary/10 text-secondary"
                            }`}
                          >
                            {s.providerType === "ACADEMIA"
                              ? "Academia"
                              : s.professionTitle || "Profissional"}
                          </span>
                          <span className="text-xs text-muted-foreground">{s.modality}</span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-foreground">{s.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {s.providerName}
                        {s.providerType === "PERSONAL" && s.professionTitle ? ` • ${s.professionTitle}` : ""}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {(() => {
                          const rating = s.providerRating ?? s.rating;
                          const total = s.totalReviews ?? s.reviewsCount;
                          if (rating == null) return null;
                          return (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="text-foreground font-medium">{Number(rating).toFixed(1)}</span>
                              <span>({total ?? 0} {(total ?? 0) === 1 ? "avaliação" : "avaliações"})</span>
                            </span>
                          );
                        })()}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {s.durationMinutes} min
                        </span>
                        {(() => {
                          const d = s.distance ?? s.distanceKm;
                          return d != null ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              A {d.toFixed(1).replace(".", ",")} km de você
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    </div>
                    <div className="flex md:flex-col items-end justify-between md:justify-center gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-secondary">{formatBRL(s.price)}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.type === "PLANO_MENSAL" ? "por mês" : s.type === "DAY_PASS" ? "day pass" : "por sessão"}
                        </div>
                      </div>
                      <Button variant="hero" size="sm">Ver horários</Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              Nenhum serviço encontrado com esses filtros.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Buscar;
