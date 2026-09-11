import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { listServiceCatalog } from "@/services/service-catalog";
import { listServices, createService, updateService, removeService } from "@/services/services";
import { getMyPersonalProfile, updateMyPersonalProfile } from "@/services/users";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { formatBRL } from "@/lib/format";
import type { Service, PersonalProfileData, UpdatePersonalProfileDto } from "@/types/api";
import { IntelligentPrescriptionWizard } from "@/components/prescription/IntelligentPrescriptionWizard";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Clock,
  Tag,
  CreditCard,
  Award,
  Sparkles,
  CheckCircle2,
  MapPin,
  Building,
  Zap,
  Globe,
  MessageCircle,
  Instagram,
  ImageIcon,
  ShieldCheck,
  Check,
  X,
  Dumbbell,
  Users,
  ChevronRight,
  Sliders,
  Utensils,
} from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Opções pré-definidas de especialidades para profissionais
const PRESET_SPECIALTIES = [
  "Hipertrofia Muscular",
  "Emagrecimento & Definição",
  "Consultoria Online",
  "Biomecânica & Postura",
  "Treinamento Funcional",
  "Reabilitação de Lesões",
  "Atletas de Alto Rendimento",
  "Idosos & Longevidade",
  "Gestantes & Pós-Parto",
  "Corrida & Endurance",
  "Mobilidade & Flexibilidade",
  "Nutrição Esportiva",
];

// Locais de atendimento disponíveis
const PRESET_LOCATIONS = [
  "Online / Remoto pelo App Finex",
  "Academias Parceiras Cadastradas",
  "Atendimento a Domicílio / Condomínio",
  "Parques e Ar Livre",
  "Consultório / Estúdio Próprio",
];

// Benefícios sugeridos para planos de treino
const SUGGESTED_PLAN_BENEFITS = [
  "Ficha de Treino Personalizada no App Finex",
  "Ajustes Semanais de Volume e Carga",
  "Suporte e Dúvidas pelo Chat do App Finex",
  "Vídeos demonstrativos de execução dos exercícios",
  "Avaliação Física por Bioimpedância e Dobras",
  "Ajuste na Periodização a cada 4 semanas",
  "Análise de vídeos de execução de movimentos",
  "Planejamento de Metas e Evolução de Cargas",
];

export default function MeusServicos() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"plans" | "services" | "customization">("plans");

  // Diálogo para Adicionar Novo Plano de Treino
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planModality, setPlanModality] = useState("Musculação");
  const [planRecurrence, setPlanRecurrence] = useState("MONTHLY");
  const [planFormat, setPlanFormat] = useState("ONLINE");
  const [planPrice, setPlanPrice] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planMaxStudents, setPlanMaxStudents] = useState("20");
  const [planSelectedBenefits, setPlanSelectedBenefits] = useState<string[]>([
    "Ficha de Treino Personalizada no App Finex",
    "Ajustes Semanais de Volume e Carga",
    "Suporte e Dúvidas pelo Chat do App Finex",
  ]);
  const [customBenefitInput, setCustomBenefitInput] = useState("");

  // Diálogo para Adicionar Serviço Avulso do Catálogo
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [addServicePrice, setAddServicePrice] = useState("");

  // Estado para Edição de Preço / Detalhes de Serviço ou Plano
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editPrice, setEditPrice] = useState("");

  // Estado para Customização da Prestação de Serviço (Aba 3)
  const [methodology, setMethodology] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedDefaultBenefits, setSelectedDefaultBenefits] = useState<string[]>([]);
  const [customDefaultBenefit, setCustomDefaultBenefit] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [isPrescriptionWizardOpen, setIsPrescriptionWizardOpen] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "PERSONAL" && user?.role !== "ACADEMIA") return <Navigate to="/" replace />;

  // 1. Carregar serviços e planos do usuário
  const { data: allServices = [], isLoading: isLoadingMyServices } = useQuery({
    queryKey: ["my-services", user.id],
    queryFn: () => listServices({ providerType: user.role as "PERSONAL" | "ACADEMIA", q: "" }),
  });

  const myOwnServices = allServices.filter((s: Service) => s.providerId === user.id);
  const myTrainingPlans = myOwnServices.filter((s: Service) => s.type === "PLANO_MENSAL" || s.recurrence);
  const mySingleServices = myOwnServices.filter((s: Service) => s.type !== "PLANO_MENSAL");

  // 2. Carregar catálogo base para serviços avulsos
  const { data: catalog = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: () => listServiceCatalog(),
  });

  // 3. Carregar Perfil do Profissional para customização
  const { data: personalProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["my-personal-profile", user.id],
    queryFn: () => getMyPersonalProfile(),
    enabled: user.role === "PERSONAL",
  });

  // Sincronizar dados do perfil no formulário da Aba 3
  useEffect(() => {
    if (personalProfile) {
      setMethodology(personalProfile.methodology || "");
      setSelectedSpecialties(personalProfile.specialties || PRESET_SPECIALTIES.slice(0, 4));
      setSelectedLocations(personalProfile.serviceLocations || PRESET_LOCATIONS.slice(0, 3));
      setSelectedDefaultBenefits(personalProfile.includedBenefits || SUGGESTED_PLAN_BENEFITS.slice(0, 4));
      setInstagram(personalProfile.instagram || "");
      setWhatsapp(personalProfile.whatsapp || user.phone || "");
      setGalleryUrls(personalProfile.galleryUrls || []);
    }
  }, [personalProfile, user.phone]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services", user.id] });
      queryClient.invalidateQueries({ queryKey: ["provider-services", user.id] });
      toast({ title: "Sucesso!", description: "Plano/Serviço adicionado ao seu portfólio." });
      setIsAddPlanOpen(false);
      setIsAddServiceOpen(false);
      // Reset plan form
      setPlanName("");
      setPlanPrice("");
      setPlanDescription("");
      setSelectedCatalogId("");
      setAddServicePrice("");
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao criar",
        description: err.message || "Não foi possível criar o serviço.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => updateService(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services", user.id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["provider-services", user.id] });
      toast({ title: "Preço atualizado!", description: "O novo valor já está ativo em seu catálogo." });
      setEditingService(null);
      setEditPrice("");
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services", user.id] });
      queryClient.invalidateQueries({ queryKey: ["provider-services", user.id] });
      toast({ title: "Removido", description: "Plano/Serviço removido com sucesso." });
    },
  });

  // Handler para criar Plano de Treino Mensal
  const handleCreateTrainingPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !planPrice) {
      toast({ title: "Campos obrigatórios", description: "Preencha o nome e o preço do plano.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      providerId: user.id,
      providerType: "PERSONAL",
      name: planName,
      modality: planModality,
      description: planDescription || undefined,
      type: "PLANO_MENSAL",
      recurrence: planRecurrence,
      format: planFormat,
      price: planPrice.replace(",", "."),
      durationMinutes: planRecurrence === "ANNUAL" ? 525600 : planRecurrence === "SEMIANNUAL" ? 259200 : planRecurrence === "QUARTERLY" ? 129600 : 43200,
      benefits: planSelectedBenefits,
      maxStudents: parseInt(planMaxStudents, 10) || 20,
      isActive: true,
    });
  };

  // Handler para criar Serviço Avulso do Catálogo
  const handleAddCatalogService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogId || !addServicePrice) return;

    createMutation.mutate({
      catalogId: selectedCatalogId,
      providerId: user.id,
      providerType: user.role,
      type: "SESSAO",
      price: addServicePrice.replace(",", "."),
      isActive: true,
    });
  };

  const handleStartEdit = (service: Service) => {
    setEditingService(service);
    setEditPrice(String(service.price ?? ""));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editPrice) return;

    updateMutation.mutate({
      id: editingService.id,
      dto: {
        price: editPrice.replace(",", "."),
      },
    });
  };

  // Handler para salvar Customização da Prestação de Serviço (Aba 3)
  const handleSaveCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCustomization(true);

    try {
      const dto: UpdatePersonalProfileDto = {
        methodology,
        specialties: selectedSpecialties,
        serviceLocations: selectedLocations,
        includedBenefits: selectedDefaultBenefits,
        instagram,
        whatsapp,
        galleryUrls,
      };

      await updateMyPersonalProfile(dto);
      queryClient.invalidateQueries({ queryKey: ["my-personal-profile", user.id] });
      queryClient.invalidateQueries({ queryKey: ["user-public", user.id] });

      toast({
        title: "Perfil de Atendimento Atualizado!",
        description: "Sua metodologia, especialidades e diferenciais foram salvos com sucesso.",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Não foi possível atualizar o perfil de atendimento.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCustomization(false);
    }
  };

  const toggleBenefit = (benefit: string) => {
    setPlanSelectedBenefits((prev) =>
      prev.includes(benefit) ? prev.filter((b) => b !== benefit) : [...prev, benefit]
    );
  };

  const addCustomBenefit = () => {
    if (!customBenefitInput.trim()) return;
    if (!planSelectedBenefits.includes(customBenefitInput.trim())) {
      setPlanSelectedBenefits((prev) => [...prev, customBenefitInput.trim()]);
    }
    setCustomBenefitInput("");
  };

  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const addCustomSpecialty = () => {
    if (!customSpecialtyInput.trim()) return;
    if (!selectedSpecialties.includes(customSpecialtyInput.trim())) {
      setSelectedSpecialties((prev) => [...prev, customSpecialtyInput.trim()]);
    }
    setCustomSpecialtyInput("");
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const toggleDefaultBenefit = (ben: string) => {
    setSelectedDefaultBenefits((prev) =>
      prev.includes(ben) ? prev.filter((b) => b !== ben) : [...prev, ben]
    );
  };

  const addCustomDefaultBenefit = () => {
    if (!customDefaultBenefit.trim()) return;
    if (!selectedDefaultBenefits.includes(customDefaultBenefit.trim())) {
      setSelectedDefaultBenefits((prev) => [...prev, customDefaultBenefit.trim()]);
    }
    setCustomDefaultBenefit("");
  };

  const addGalleryImage = () => {
    if (!newImageUrl.trim()) return;
    setGalleryUrls((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const removeGalleryImage = (index: number) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const availableCatalog = catalog.filter((c) => !myOwnServices.some((ms) => ms.name === c.name));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 md:pt-28 pb-16 max-w-5xl space-y-8">
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-primary pl-1">
              Meus Serviços & Planos de Treino
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Crie planos de consultoria mensal, gerencie sessões avulsas e personalize sua metodologia de atendimento.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="hero"
              size="sm"
              onClick={() => setIsPrescriptionWizardOpen(true)}
              className="rounded-xl font-bold text-xs shadow-glow gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
              Prescritor Inteligente (Elite)
            </Button>

            <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs" asChild>
              <Link to={`/perfil-publico/${user.id}`}>
                <Globe className="w-3.5 h-3.5 mr-1.5 text-primary" /> Ver Perfil Público
              </Link>
            </Button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/80 scrollbar-none">
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
              activeTab === "plans"
                ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                : "bg-card text-muted-foreground hover:bg-muted border border-border/60"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Planos & Consultorias Mensais ({myTrainingPlans.length})
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
              activeTab === "services"
                ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                : "bg-card text-muted-foreground hover:bg-muted border border-border/60"
            }`}
          >
            <Dumbbell className="w-4 h-4" /> Aulas & Serviços Avulsos ({mySingleServices.length})
          </button>

          {user.role === "PERSONAL" && (
            <button
              onClick={() => setActiveTab("customization")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 ${
                activeTab === "customization"
                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border/60"
              }`}
            >
              <Award className="w-4 h-4" /> Personalização da Prestação de Serviço
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: PLANOS & CONSULTORIAS MENSAIS */}
        {/* ========================================================================= */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display text-foreground">
                  Seus Planos de Treino & Consultoria Ativos
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Planos com acompanhamento recorrente (Mensal, Trimestral, Semestral, Anual) exibidos diretamente para os alunos contratarem no seu perfil.
                </p>
              </div>

              {/* MODAL NOVO PLANO DE TREINO */}
              <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="shrink-0 rounded-2xl font-bold shadow-glow gap-1.5">
                    <Plus className="w-4 h-4" /> Novo Plano de Treino
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border/80 rounded-3xl p-6 space-y-4">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-display font-black">
                      <CreditCard className="w-5 h-5 text-primary" /> Criar Plano de Treino / Consultoria
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Configure um plano de acompanhamento mensal ou periódico com ficha no aplicativo Finex.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleCreateTrainingPlan} className="space-y-4 pt-2">
                    {/* Nome do Plano */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Nome do Plano *</label>
                      <Input
                        placeholder="Ex: Consultoria Online Premium / Personal Presencial 3x/sem"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>

                    {/* Modalidade & Formato */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Modalidade / Foco</label>
                        <Select value={planModality} onValueChange={setPlanModality}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Musculação">Musculação & Hipertrofia</SelectItem>
                            <SelectItem value="Consultoria Online">Consultoria Online</SelectItem>
                            <SelectItem value="Emagrecimento">Emagrecimento & Definição</SelectItem>
                            <SelectItem value="Treinamento Funcional">Treinamento Funcional</SelectItem>
                            <SelectItem value="Reabilitação">Reabilitação Postural & Lesões</SelectItem>
                            <SelectItem value="Corrida">Corrida & Endurance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Formato do Atendimento</label>
                        <Select value={planFormat} onValueChange={setPlanFormat}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONLINE">Online (100% pelo App Finex)</SelectItem>
                            <SelectItem value="PRESENCIAL">Presencial (Academia / Domicílio)</SelectItem>
                            <SelectItem value="HIBRIDO">Híbrido (Online + Presencial)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Recorrência & Preço */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Recorrência / Período</label>
                        <Select value={planRecurrence} onValueChange={setPlanRecurrence}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTHLY">Mensal (30 dias)</SelectItem>
                            <SelectItem value="QUARTERLY">Trimestral (3 meses)</SelectItem>
                            <SelectItem value="SEMIANNUAL">Semestral (6 meses)</SelectItem>
                            <SelectItem value="ANNUAL">Anual (12 meses)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Preço Total do Plano (R$) *</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 180.00"
                          value={planPrice}
                          onChange={(e) => setPlanPrice(e.target.value)}
                          required
                          className="rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Descrição / Objetivos do Plano</label>
                      <Textarea
                        placeholder="Explique como funcionará o acompanhamento, metas do aluno e frequência de contato..."
                        value={planDescription}
                        onChange={(e) => setPlanDescription(e.target.value)}
                        rows={3}
                        className="rounded-xl text-xs leading-relaxed"
                      />
                    </div>

                    {/* Benefícios Inclusos */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <label className="text-xs font-bold text-foreground block">
                        Benefícios Inclusos no Plano:
                      </label>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {SUGGESTED_PLAN_BENEFITS.map((b, i) => (
                          <div
                            key={i}
                            onClick={() => toggleBenefit(b)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                              planSelectedBenefits.includes(b)
                                ? "bg-primary/10 border-primary/40 text-foreground font-semibold"
                                : "bg-card border-border/60 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                planSelectedBenefits.includes(b)
                                  ? "bg-primary border-primary text-black"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {planSelectedBenefits.includes(b) && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="flex-1">{b}</span>
                          </div>
                        ))}
                      </div>

                      {/* Adicionar benefício personalizado */}
                      <div className="flex gap-2 pt-1">
                        <Input
                          placeholder="Adicionar outro benefício..."
                          value={customBenefitInput}
                          onChange={(e) => setCustomBenefitInput(e.target.value)}
                          className="h-9 text-xs rounded-xl"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomBenefit();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCustomBenefit}
                          className="h-9 px-3 text-xs rounded-xl"
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddPlanOpen(false)}
                        className="rounded-xl font-bold"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="hero"
                        disabled={createMutation.isPending || !planName || !planPrice}
                        className="rounded-xl font-black"
                      >
                        {createMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...
                          </>
                        ) : (
                          "Publicar Plano de Treino"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* LISTA DE PLANOS EM CARDS */}
            {isLoadingMyServices ? (
              <div className="py-16 text-center bg-card rounded-3xl border border-border">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Carregando seus planos de treino...</p>
              </div>
            ) : myTrainingPlans.length === 0 ? (
              <div className="bg-card rounded-3xl border-2 border-dashed border-border/80 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-bold text-lg text-foreground">Você ainda não tem planos cadastrados</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Crie planos mensais de consultoria online ou acompanhamento presencial para que os alunos possam contratar seus serviços com segurança.
                  </p>
                </div>
                <Button variant="hero" onClick={() => setIsAddPlanOpen(true)} className="rounded-2xl font-bold">
                  <Plus className="w-4 h-4 mr-1.5" /> Criar Meu Primeiro Plano
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myTrainingPlans.map((plan: Service) => {
                  const formatLabel =
                    plan.format === "ONLINE"
                      ? "Online / App Finex"
                      : plan.format === "PRESENCIAL"
                      ? "Presencial"
                      : "Híbrido";

                  const recurrenceLabel =
                    plan.recurrence === "ANNUAL"
                      ? "Anual"
                      : plan.recurrence === "SEMIANNUAL"
                      ? "Semestral"
                      : plan.recurrence === "QUARTERLY"
                      ? "Trimestral"
                      : "Mensal";

                  return (
                    <div
                      key={plan.id}
                      className="bg-card rounded-3xl p-6 border border-border/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                            {recurrenceLabel}
                          </span>
                          <span className="text-[10px] font-bold bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-md">
                            {formatLabel}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
                          <span className="text-xs text-muted-foreground">{plan.modality}</span>
                        </div>

                        {plan.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {plan.description}
                          </p>
                        )}

                        <div className="py-2 border-y border-border/40">
                          <span className="text-xs text-muted-foreground block">Valor do Plano</span>
                          <span className="text-2xl font-black text-secondary">{formatBRL(plan.price)}</span>
                        </div>

                        {plan.benefits && plan.benefits.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-foreground block">Incluso:</span>
                            {plan.benefits.slice(0, 3).map((b, bIdx) => (
                              <div key={bIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="truncate">{b}</span>
                              </div>
                            ))}
                            {plan.benefits.length > 3 && (
                              <span className="text-[10px] text-primary font-semibold block">
                                +{plan.benefits.length - 3} outros benefícios
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold"
                          onClick={() => handleStartEdit(plan)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Editar Preço
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => {
                            if (confirm(`Deseja remover o plano "${plan.name}"?`)) {
                              deleteMutation.mutate(plan.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: AULAS & ATENDIMENTOS AVULSOS */}
        {/* ========================================================================= */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display text-foreground">
                  Aulas e Atendimentos Avulsos
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Adicione atendimentos individuais ou avaliações físicas do catálogo base ao seu portfólio.
                </p>
              </div>

              {/* MODAL NOVO SERVIÇO DO CATÁLOGO */}
              <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                <DialogTrigger asChild>
                  <Button className="shrink-0 rounded-2xl font-bold gap-1.5">
                    <Plus className="w-4 h-4" /> Adicionar do Catálogo Base
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border/80 rounded-3xl p-6 space-y-4">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-display font-black">
                      <Dumbbell className="w-5 h-5 text-primary" /> Adicionar Atendimento Avulso
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Selecione um serviço do catálogo base e defina seu valor por sessão.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleAddCatalogService} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Serviço Base *</label>
                      <Select value={selectedCatalogId} onValueChange={setSelectedCatalogId}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder={isLoadingCatalog ? "Carregando..." : "Selecione o serviço"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCatalog.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} ({c.durationMinutes} min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Seu Preço por Sessão (R$) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 120.00"
                        value={addServicePrice}
                        onChange={(e) => setAddServicePrice(e.target.value)}
                        required
                        className="rounded-xl font-bold"
                      />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddServiceOpen(false)}
                        className="rounded-xl font-bold"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="hero"
                        disabled={createMutation.isPending || !selectedCatalogId}
                        className="rounded-xl font-black"
                      >
                        Adicionar ao Portfólio
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* TABELA DE SERVIÇOS AVULSOS */}
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
              {isLoadingMyServices ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Carregando serviços...</p>
                </div>
              ) : mySingleServices.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Tag className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                  <h3 className="font-bold text-foreground">Nenhuma sessão avulsa cadastrada</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Adicione sessões avulsas (60 min) do catálogo base para agendamentos individuais.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-bold">Serviço</TableHead>
                      <TableHead className="font-bold">Modalidade</TableHead>
                      <TableHead className="font-bold">Duração</TableHead>
                      <TableHead className="font-bold">Preço</TableHead>
                      <TableHead className="w-[120px] text-right font-bold pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mySingleServices.map((service: Service) => (
                      <TableRow key={service.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-semibold text-foreground">
                          {service.name}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            {service.modality}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {service.durationMinutes >= 720 ? "Dia Todo" : `${service.durationMinutes} min`}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-secondary text-base">
                          {formatBRL(service.price)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary hover:bg-primary/10 rounded-xl"
                              onClick={() => handleStartEdit(service)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 rounded-xl"
                              onClick={() => {
                                if (confirm(`Deseja remover "${service.name}"?`)) {
                                  deleteMutation.mutate(service.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: PERSONALIZAÇÃO DA PRESTAÇÃO DE SERVIÇO */}
        {/* ========================================================================= */}
        {activeTab === "customization" && user.role === "PERSONAL" && (
          <form onSubmit={handleSaveCustomization} className="space-y-8">
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Minha Metodologia & Abordagem
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Explique para seus alunos como você planeja os treinos, periodização e metodologia prática.
                  </p>
                </div>
              </div>

              <Textarea
                placeholder="Ex: Utilizo uma metodologia focada em biomecânica e segurança articular, com avaliações periódicas a cada 4 semanas e progressão linear de cargas..."
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                rows={4}
                className="rounded-2xl text-xs sm:text-sm leading-relaxed p-4"
              />
            </div>

            {/* Especialidades & Foco */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Especialidades & Foco de Atuação
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Selecione as áreas em que você é especialista para destacar no seu perfil.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {PRESET_SPECIALTIES.map((spec, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => toggleSpecialty(spec)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedSpecialties.includes(spec)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                    }`}
                  >
                    {selectedSpecialties.includes(spec) && <Check className="w-3 h-3" />}
                    {spec}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2 max-w-md">
                <Input
                  placeholder="Adicionar outra especialidade..."
                  value={customSpecialtyInput}
                  onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSpecialty();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomSpecialty}
                  className="h-9 px-3 text-xs rounded-xl"
                >
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Locais de Atendimento */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Locais & Formatos de Atendimento
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Indique onde você atende os alunos cadastrados na Finex.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {PRESET_LOCATIONS.map((loc, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleLocation(loc)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition-colors ${
                      selectedLocations.includes(loc)
                        ? "bg-secondary/10 border-secondary/40 text-foreground font-bold"
                        : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                        selectedLocations.includes(loc)
                          ? "bg-secondary border-secondary text-black"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {selectedLocations.includes(loc) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span>{loc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comunicação Segura & Redes */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Comunicação Segura & Redes
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Toda a contratação de planos e acompanhamento de treinos ocorre exclusivamente pelo Chat interno do App Finex.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1 text-xs text-foreground">
                <p className="font-bold flex items-center gap-1.5 text-primary">
                  <Sparkles className="w-4 h-4" /> Proteção Anti-Fraude e Garantia de Repasses Finex
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Para garantir sua segurança jurídica, controle de alunos e fidelidade dos planos, os alunos conversam com você e contratam seus serviços exclusivamente através do nosso Chat integrado.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram Profissional (@)
                  </label>
                  <Input
                    placeholder="Ex: @personal_finex"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Galeria de Fotos & Resultados */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Galeria de Fotos & Transformações
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Exiba fotos de alunos, resultados práticos e ambiente de treino.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 max-w-xl">
                <Input
                  placeholder="Cole a URL da foto (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="rounded-xl text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addGalleryImage}
                  className="rounded-xl text-xs font-bold shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Foto
                </Button>
              </div>

              {galleryUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-border/60 group">
                      <img src={url} alt={`Galeria ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Nenhuma foto adicionada ainda.</p>
              )}
            </div>

            {/* BOTÃO SALVAR TUDO */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                disabled={isSavingCustomization}
                className="rounded-2xl font-black px-8 h-12 shadow-glow text-black"
              >
                {isSavingCustomization ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Salvar Personalização do Atendimento
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* MODAL DE EDIÇÃO RÁPIDA DE PREÇO */}
        <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
          <DialogContent className="bg-card border-border/80 rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" /> Editar Preço
              </DialogTitle>
              <DialogDescription>
                Atualize o valor cobrado para {editingService?.name}.
              </DialogDescription>
            </DialogHeader>

            {editingService && (
              <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                <div className="p-3.5 bg-muted/50 rounded-2xl border border-border space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold">Item Selecionado</span>
                  <div className="font-bold text-foreground text-sm">{editingService.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {editingService.modality} • {editingService.type === "PLANO_MENSAL" ? "Plano Mensal" : `${editingService.durationMinutes} min`}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Novo Preço (R$)</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 180,00"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    autoFocus
                    className="text-lg font-bold rounded-xl"
                  />
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingService(null)}
                    className="rounded-xl font-bold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={updateMutation.isPending || !editPrice}
                    className="rounded-xl font-black"
                  >
                    {updateMutation.isPending ? "Salvando..." : "Salvar Preço"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <IntelligentPrescriptionWizard
          open={isPrescriptionWizardOpen}
          onOpenChange={setIsPrescriptionWizardOpen}
          onPrescriptionPublished={() => {
            queryClient.invalidateQueries({ queryKey: ["my-services", user.id] });
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
