import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listServices } from "@/services/services";
import { formatBRL } from "@/lib/format";
import {
  MapPin,
  Search,
  Star,
  Clock,
  LocateFixed,
  Loader2,
  BadgeCheck,
  Building2,
  ExternalLink,
  ThumbsUp,
  AlertCircle,
  Share2,
  Sparkles,
  ChevronRight,
  PlusCircle,
  Map as MapIcon,
  List as ListIcon,
  Navigation,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { ExternalGym, getRealGymsByCity } from "@/services/externalGyms";
import { InviteGymModal } from "@/components/InviteGymModal";
import { GymsMap } from "@/components/GymsMap";

const typeOptions: { value: "" | "PERSONAL" | "ACADEMIA"; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "ACADEMIA", label: "Academias" },
  { value: "PERSONAL", label: "Profissionais" },
];

const generalModalities: { value: string; label: string }[] = [
  { value: "Todos", label: "Todas as modalidades" },
  { value: "Personal", label: "Personal & Musculação" },
  { value: "Nutri", label: "Nutrição" },
  { value: "Fisio", label: "Fisioterapia" },
  { value: "Masso", label: "Massoterapia" },
  { value: "Pilates", label: "Pilates" },
  { value: "Yoga", label: "Yoga" },
  { value: "Funcional", label: "Funcional" },
  { value: "CrossFit", label: "CrossFit" },
];

const professionalModalities: { value: string; label: string }[] = [
  { value: "Todos", label: "Todos os profissionais" },
  { value: "Personal", label: "Personal Trainer" },
  { value: "Nutri", label: "Nutricionista" },
  { value: "Fisio", label: "Fisioterapeuta" },
  { value: "Masso", label: "Massoterapeuta" },
  { value: "Pilates", label: "Pilates" },
  { value: "Yoga", label: "Yoga" },
  { value: "Funcional", label: "Treino Funcional" },
];

const gymModalities: { value: string; label: string }[] = [
  { value: "Todos", label: "Todas as modalidades" },
  { value: "Academia", label: "Day Pass / Musculação" },
  { value: "Funcional", label: "Funcional" },
  { value: "CrossFit", label: "CrossFit" },
  { value: "Pilates", label: "Pilates" },
  { value: "Yoga", label: "Yoga" },
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

  // Controle de Cidade Selecionada para Resultados
  const [selectedCity, setSelectedCity] = useState("São Paulo - SP");
  const [customCityInput, setCustomCityInput] = useState("");
  const [gymFilterTab, setGymFilterTab] = useState<"ALL" | "PARTNER" | "EXTERNAL">("ALL");
  const [selectedGymForInvite, setSelectedGymForInvite] = useState<ExternalGym | null>(null);
  const [gymViewMode, setGymViewMode] = useState<"both" | "list" | "map">("both");

  const CITIES_PRESETS = [
    "São Paulo - SP",
    "Santa Maria - RS",
    "Porto Alegre - RS",
    "Rio de Janeiro - RJ",
    "Curitiba - PR",
    "Uruguaiana - RS",
  ];

  const requestGeolocation = async (silent = false) => {
    if (coords && !silent) {
      // Se já possui coords ativas e o usuário clicou de novo, desativa
      setCoords(null);
      setRadiusKm(undefined);
      toast({ title: "Filtro GPS removido", description: `Exibindo resultados da cidade: ${selectedCity}` });
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
          } catch {
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
          setCoords(null);
          if (!silent) {
            toast({
              title: "Permissão de GPS Não Concedida",
              description: "Para usar 'Perto de mim', permita o acesso ao GPS ou escolha uma cidade no seletor acima.",
            });
          }
          return;
        }
      }

      // Executando no navegador Web
      if (!("geolocation" in navigator)) {
        setGeoLoading(false);
        setCoords(null);
        if (!silent) {
          toast({
            title: "GPS não suportado",
            description: "Geolocalização não suportada neste navegador. Selecione uma cidade para filtrar os resultados.",
          });
        }
        return;
      }

      const isSecure =
        window.isSecureContext ||
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (!isSecure) {
        setGeoLoading(false);
        setCoords(null);
        if (!silent) {
          toast({
            title: "Conexão Não Segura (HTTP)",
            description: "A geolocalização no navegador requer HTTPS. Selecione uma cidade acima.",
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
          setCoords(null);
          if (!silent) {
            let desc = "Não foi possível obter o GPS. Selecione uma cidade para pesquisar.";
            if (err.code === err.PERMISSION_DENIED) {
              desc = "Permissão de GPS negada. Selecione uma cidade ou autorize nas permissões do navegador.";
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              desc = "Sinal de GPS indisponível no dispositivo. Selecione uma cidade acima.";
            } else if (err.code === err.TIMEOUT) {
              desc = "Tempo esgotado para obter localização. Tente novamente ou selecione uma cidade.";
            }
            toast({
              title: "Localização Não Disponível",
              description: desc,
            });
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 }
      );
    } catch {
      setGeoLoading(false);
      setCoords(null);
      if (!silent) {
        toast({
          title: "Atenção",
          description: "Não foi possível obter sua localização. Selecione uma cidade para ver os resultados.",
        });
      }
    }
  };

  // Auto-tenta apenas se já concedido anteriormente pelo usuário
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

  const selectedCityClean = selectedCity.split(" - ")[0].trim();

  // Busca serviços credenciados Finex via backend
  const { data: services, isLoading } = useQuery({
    queryKey: ["services", { q, modality, providerType, coords, radiusKm, city: coords ? undefined : selectedCityClean }],
    queryFn: () =>
      listServices({
        q: q || undefined,
        modality: modality !== "Todos" ? modality : undefined,
        providerType: providerType || undefined,
        city: coords ? undefined : selectedCityClean,
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm: coords ? radiusKm : undefined,
      }),
  });

  // Busca academias reais (Google Places New & Parceiras Finex)
  const {
    data: realGyms = [],
    isLoading: loadingRealGyms,
    refetch: refetchRealGyms,
  } = useQuery({
    queryKey: ["external-gyms", { city: coords ? undefined : selectedCityClean, coords }],
    queryFn: () => getRealGymsByCity(coords ? undefined : selectedCityClean, coords),
  });


  const currentModalityOptions =
    providerType === "PERSONAL"
      ? professionalModalities
      : providerType === "ACADEMIA"
      ? gymModalities
      : generalModalities;

  const handleProviderTypeChange = (val: "" | "PERSONAL" | "ACADEMIA") => {
    setProviderType(val);
    setModality("Todos");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 sm:pt-32 md:pt-36 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Encontre seu <span className="gradient-text">treino</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{coords ? "Filtrando por proximidade GPS" : `Exibindo resultados em ${selectedCity}`}</span>
            </div>

            {/* SELETOR RÁPIDO DE CIDADES BRASILEIRAS */}
            <div className="mt-4 p-3.5 rounded-2xl bg-card border border-border/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground shrink-0 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  Cidade Selecionada:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                  {CITIES_PRESETS.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setCoords(null);
                        setCustomCityInput("");
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCity === city && !coords
                          ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Digitar outra cidade */}
              <div className="flex items-center gap-1.5 w-full md:w-auto">
                <Input
                  placeholder="Ou digite outra cidade..."
                  value={customCityInput}
                  onChange={(e) => setCustomCityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customCityInput.trim()) {
                      setSelectedCity(customCityInput.trim());
                      setCoords(null);
                    }
                  }}
                  className="h-8 text-xs rounded-xl bg-muted/70 min-w-[180px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (customCityInput.trim()) {
                      setSelectedCity(customCityInput.trim());
                      setCoords(null);
                    }
                  }}
                  className="h-8 text-xs rounded-xl font-semibold shrink-0"
                >
                  Buscar Cidade
                </Button>
              </div>
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
                  aria-label="Buscar academia, profissional ou modalidade"
                  placeholder="Buscar academia, profissional, modalidade..."
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
            <div className="flex flex-col gap-3 mt-4">
              {/* Nível 1: Tipo de Prestador */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-1">Filtrar por:</span>
                {typeOptions.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => handleProviderTypeChange(t.value)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      providerType === t.value
                        ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Nível 2: Especialidades / Modalidades Contextuais */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                <span className="text-xs font-medium text-muted-foreground mr-1">
                  {providerType === "PERSONAL"
                    ? "Especialidade:"
                    : providerType === "ACADEMIA"
                    ? "Modalidade:"
                    : "Categoria:"}
                </span>
                {currentModalityOptions.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => setModality(m.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      modality === m.value
                        ? "bg-secondary text-secondary-foreground font-semibold shadow-sm scale-[1.02]"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {/* SERVIÇOS CREDENCIADOS FINEX */}
              {services && services.length > 0 ? (
                <div className="grid gap-4">
                  {services.map((s) => {
                    const avatarSrc = (() => {
                      if (s.providerAvatar) return s.providerAvatar;
                      const lowerName = (s.providerName || s.name || "").toLowerCase();
                      const lowerMod = (s.modality || "").toLowerCase();
                      const lowerTitle = (s.professionTitle || "").toLowerCase();
                      if (s.providerType === "ACADEMIA" || lowerMod.includes("academia")) {
                        return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop";
                      }
                      if (lowerName.includes("camila") || lowerName.includes("dra") || lowerMod.includes("nutri") || lowerTitle.includes("nutri")) {
                        return "https://images.unsplash.com/photo-1594824813580-c1165a6f2369?q=80&w=400&auto=format&fit=crop";
                      }
                      if (lowerName.includes("rodrigo") || lowerMod.includes("fisio") || lowerTitle.includes("fisio")) {
                        return "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop";
                      }
                      if (lowerName.includes("diego") || lowerMod.includes("personal") || lowerTitle.includes("personal")) {
                        return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop";
                      }
                      return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop";
                    })();

                    return (
                      <Link
                        key={s.id}
                        to={`/perfil/${s.providerId || s.id}`}
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
                                  src={avatarSrc} 
                                  alt={s.providerName || "Profissional"} 
                                  className="w-full h-full rounded-full object-cover border-2 border-background"
                                />
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    s.providerType === "ACADEMIA"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-secondary/10 text-secondary"
                                  }`}
                                >
                                  {s.providerType === "ACADEMIA"
                                    ? "Academia Parceira"
                                    : s.professionTitle || "Profissional"}
                                </span>
                                <span className="text-xs text-muted-foreground">{s.modality}</span>

                                {s.attendanceType === "ONLINE" ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                    <Globe className="w-2.5 h-2.5" /> 100% Online
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground border border-border flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    {s.partnerGymName
                                      ? `Presencial na ${s.partnerGymName}`
                                      : s.locationName
                                      ? `Presencial em ${s.locationName}`
                                      : "Presencial"}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-display font-bold text-lg text-foreground">{s.name}</h3>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {s.providerName}
                                {s.providerType === "PERSONAL" && s.professionTitle ? ` • ${s.professionTitle}` : ""}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                                {(() => {
                                  const total = s.totalReviews ?? s.reviewsCount ?? 0;
                                  const rating = s.providerRating ?? s.rating;
                                  if (total > 0 && rating != null) {
                                    return (
                                      <span className="flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                        <span className="text-foreground font-medium">{Number(rating).toFixed(1)}</span>
                                        <span>({total} {total === 1 ? "avaliação" : "avaliações"})</span>
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="flex items-center gap-1 text-primary font-medium">
                                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                                      <span>Novo no Finex</span>
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
                            <span className="inline-flex items-center justify-center rounded-xl text-xs font-bold px-3.5 py-2 bg-primary text-primary-foreground shadow-sm hover:opacity-95 transition-opacity pointer-events-none">
                              {s.providerType === "ACADEMIA" ? "Conhecer Academia & Planos" : "Ver Perfil & Planos"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground bg-card/40 rounded-2xl border border-dashed border-border/80">
                  <Building2 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="font-semibold text-sm">Nenhum serviço credenciado encontrado para {coords ? "esta localização" : selectedCity}.</p>
                  <p className="text-xs text-muted-foreground mt-1">Veja abaixo as academias reais mapeadas nesta região e ajude a trazê-las para o Finex!</p>
                </div>
              )}

              {/* SEÇÃO ESPECIAL: ACADEMIAS REAIS (GOOGLE PLACES & PARCEIRAS FINEX) */}
              {(providerType === "" || providerType === "ACADEMIA") && (
                <div className="pt-6 border-t border-border/60 space-y-4">
                  {realGyms.length > 0 ? (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-display text-xl font-bold text-foreground">
                              Academias Parceiras {coords ? "Perto de Você" : `em ${selectedCity}`}
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                              <BadgeCheck className="w-3 h-3" /> Credenciadas Finex
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Academias credenciadas no Finex para treinar com Day Pass e planos digitais.
                          </p>
                        </div>

                        {/* Alternador de visualização: Lista / Mapa / Ambos */}
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl self-start sm:self-auto shrink-0 border border-border/60">
                          <button
                            type="button"
                            onClick={() => setGymViewMode("both")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              gymViewMode === "both"
                                ? "bg-card text-foreground shadow-sm scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Ambos
                          </button>
                          <button
                            type="button"
                            onClick={() => setGymViewMode("map")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              gymViewMode === "map"
                                ? "bg-card text-foreground shadow-sm scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <MapIcon className="w-3.5 h-3.5 text-primary" />
                            Mapa
                          </button>
                          <button
                            type="button"
                            onClick={() => setGymViewMode("list")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              gymViewMode === "list"
                                ? "bg-card text-foreground shadow-sm scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <ListIcon className="w-3.5 h-3.5" />
                            Lista
                          </button>
                        </div>
                      </div>

                      {/* MAPA INTERATIVO LEAFLET / OSM */}
                      {(gymViewMode === "map" || gymViewMode === "both") && (
                        <GymsMap
                          gyms={realGyms}
                          userCoords={coords}
                          selectedCity={selectedCity}
                          onInviteGym={setSelectedGymForInvite}
                          className="my-3"
                        />
                      )}

                      {/* LISTA DE CARDS */}
                      {(gymViewMode === "list" || gymViewMode === "both") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {realGyms.map((gym) => (
                          <div
                            key={gym.id || gym.placeId}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/40 bg-card hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                          >
                            {/* Imagem da Academia */}
                            <div className="relative h-44 w-full overflow-hidden bg-muted">
                              <img
                                src={gym.photoUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop"}
                                alt={gym.name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                              {/* BADGES: PARCEIRA FINEX */}
                              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold shadow-md backdrop-blur-md">
                                  <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                                  Parceira Finex
                                </span>

                                <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-400 border border-amber-400/20">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {gym.googleRating || "5.0"}
                                </div>
                              </div>

                              <div className="absolute bottom-2.5 left-3 right-3 text-white">
                                <h3 className="font-bold text-base leading-snug drop-shadow-sm line-clamp-1">
                                  {gym.name}
                                </h3>
                                <div className="flex items-center gap-1.5 text-[11px] text-white/85 mt-0.5 truncate">
                                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                                  <span className="truncate">{gym.address && gym.address !== '- – ,' ? gym.address : gym.city || 'Local sob consulta'}</span>
                                  {typeof gym.distanceKm === 'number' && (
                                    <span className="shrink-0 bg-primary text-primary-foreground font-extrabold px-1.5 py-0.2 rounded text-[10px]">
                                      {gym.distanceKm} km
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Detalhes & Ações */}
                            <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                  <span>Horários: {gym.openingHours || "Seg a Sex"}</span>
                                  <a
                                    href={
                                      gym.lat && gym.lng
                                        ? `https://www.google.com/maps/dir/?api=1&destination=${gym.lat},${gym.lng}`
                                        : gym.mapsUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-semibold flex items-center gap-1"
                                  >
                                    Como Chegar <Navigation className="w-3 h-3" />
                                  </a>
                                </div>

                                {gym.phone && (
                                  <div className="text-[11px] text-muted-foreground">
                                    <span>Tel: {gym.phone}</span>
                                  </div>
                                )}

                                {gym.partnerDayPassPrice && (
                                  <div className="flex items-center justify-between bg-emerald-500/10 p-2 rounded-xl text-xs">
                                    <span className="text-emerald-500 font-bold">Day Pass Disponível</span>
                                    <span className="text-foreground font-black text-sm">
                                      {formatBRL(gym.partnerDayPassPrice)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="pt-2 border-t border-border/50 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  asChild
                                  className="w-full h-9 rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                >
                                  <Link to={`/perfil/${gym.partnerId || gym.id}`}>
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Ver Perfil & Comprar Day Pass
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </>
                  ) : (
                    <div className="p-8 rounded-2xl bg-card border border-dashed border-border/80 text-center space-y-3">
                      <Building2 className="w-10 h-10 text-primary mx-auto opacity-80" />
                      <h3 className="font-display font-bold text-base text-foreground">
                        Nenhuma academia parceira credenciada em {coords ? "sua localização" : selectedCity} ainda
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Conhece ou frequenta uma academia em {selectedCity}? Indique a academia para liberarmos Day Pass e matrículas digitais!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Indicação / Convite */}
      <InviteGymModal
        gym={selectedGymForInvite}
        open={Boolean(selectedGymForInvite)}
        onOpenChange={(open) => !open && setSelectedGymForInvite(null)}
        onIndicated={() => refetchRealGyms()}
      />

      <Footer />
    </div>
  );
};

export default Buscar;
