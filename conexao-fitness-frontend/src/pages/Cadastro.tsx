import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/api";

import { ArrowLeft, User, Dumbbell, Building2, Check, X, ShieldCheck, Sparkles, CheckCircle2, Camera, FileCheck, UploadCloud, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listProfessions } from "@/services/professions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FinexLogo from "@/components/FinexLogo";
import { uploadDocument, uploadAvatar } from "@/services/uploads";
import OAuthModal, { OAuthUserData } from "@/components/OAuthModal";
import { CameraCaptureModal } from "@/components/CameraCaptureModal";
import { isNativePlatform, captureNativePhoto } from "@/utils/nativeCamera";

const roleOptions: { value: UserRole; label: string; desc: string }[] = [
  { value: "STUDENT", label: "Aluno", desc: "Buscar e reservar treinos" },
  { value: "PERSONAL", label: "Profissional", desc: "Oferecer meus serviços" },
  { value: "ACADEMIA", label: "Academia", desc: "Cadastrar minha academia" },
];

const Cadastro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, oauthLogin, loading } = useAuth();
  
  const [role, setRole] = useState<UserRole>(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    if (type === "profissional") return "PERSONAL";
    if (type === "academia") return "ACADEMIA";
    return "STUDENT";
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [professionalRegistrationId, setProfessionalRegistrationId] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    } else {
      setAvatarPreview(null);
    }
  };

  // Estado da autenticação social
  const [socialAuth, setSocialAuth] = useState<OAuthUserData | null>(null);
  const [oauthProvider, setOauthProvider] = useState<"google" | "apple" | null>(null);

  // Inicializa caso tenha vindo redirecionado do login social
  useEffect(() => {
    const stateData = (location.state as any)?.oauthData as OAuthUserData | undefined;
    if (stateData) {
      setSocialAuth(stateData);
      setName(stateData.name);
      setEmail(stateData.email);
    }
  }, [location.state]);

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const { data: professions } = useQuery({
    queryKey: ["professions"],
    queryFn: listProfessions,
  });

  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [customProfession, setCustomProfession] = useState("");

  const defaultProfessions = [
    "Personal Trainer",
    "Instrutor de Pilates",
    "Professor de Yoga",
    "Nutricionista",
    "Fisioterapeuta",
    "Massoterapeuta",
    "Professor de Dança",
    "Professor de Artes Marciais",
  ];

  const availableProfessionsList = professions?.length
    ? Array.from(new Set([...professions.map((p) => p.title), ...defaultProfessions]))
    : defaultProfessions;

  const toggleProfession = (title: string) => {
    if (selectedProfessions.includes(title)) {
      setSelectedProfessions(selectedProfessions.filter((t) => t !== title));
    } else {
      setSelectedProfessions([...selectedProfessions, title]);
    }
  };

  const handleAddCustomProfession = () => {
    if (!customProfession.trim()) return;
    const clean = customProfession.trim();
    if (!selectedProfessions.includes(clean)) {
      setSelectedProfessions([...selectedProfessions, clean]);
    }
    setCustomProfession("");
  };

  const professionTitle = selectedProfessions.join(", ");

  const handleOAuthSelected = async (data: OAuthUserData) => {
    if (role === "STUDENT") {
      // Para ALUNO: Conclui o cadastro imediatamente via Google/Apple
      try {
        const res = await oauthLogin({
          provider: data.provider,
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
          role: "STUDENT",
        });

        if ("accessToken" in res && res.accessToken) {
          toast.success("Conta criada e conectada com sucesso!");
          navigate("/buscar");
        }
      } catch (err) {
        toast.error("Erro no cadastro social", { description: (err as Error).message });
      }
    } else {
      // Para PROFISSIONAL ou ACADEMIA: Salva a conta social vinculada e foca nos campos obrigatórios
      setSocialAuth(data);
      setName(data.name);
      setEmail(data.email);
      toast.info(
        `Conta ${data.provider === "google" ? "Google" : "Apple"} vinculada! Por favor, preencha os dados complementares abaixo.`
      );
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === "PERSONAL") {
      if (selectedProfessions.length === 0) {
        toast.error("Por favor, selecione ao menos uma profissão ou especialidade");
        return;
      }
      if (!professionalRegistrationId) {
        toast.error("Por favor, preencha seu número de registro profissional");
        return;
      }
      if (!documentFile) {
        toast.error("Por favor, anexe seu comprovante de registro profissional");
        return;
      }
      if (!cpf) {
        toast.error("Por favor, preencha seu CPF");
        return;
      }
      if (!phone) {
        toast.error("Por favor, preencha seu telefone");
        return;
      }
    }

    if (role === "ACADEMIA") {
      if (!cpf) {
        toast.error("Por favor, preencha o CNPJ da academia");
        return;
      }
      if (!phone) {
        toast.error("Por favor, preencha o telefone de contato");
        return;
      }
    }

    try {
      let professionalDocumentUrl = undefined;
      let userAvatarUrl = socialAuth?.avatarUrl || undefined;

      setIsUploading(true);

      // Upload do documento de registro
      if ((role === "PERSONAL" || role === "ACADEMIA") && documentFile) {
        try {
          const res = await uploadDocument(documentFile);
          professionalDocumentUrl = res.url;
        } catch (err) {
          toast.error("Erro ao enviar documento", { description: (err as Error).message });
          setIsUploading(false);
          return;
        }
      }

      // Upload da foto de perfil se fornecida
      if (avatarFile) {
        try {
          const res = await uploadAvatar(avatarFile);
          userAvatarUrl = res.url;
        } catch (err) {
          console.warn("Falha no upload do avatar:", err);
          // Continua o cadastro mesmo que o avatar falhe
        }
      }

      let newUser: any;

      if (socialAuth) {
        // Cadastro via OAuth com dados complementares
        const res = await oauthLogin({
          provider: socialAuth.provider,
          email: socialAuth.email,
          name: name || socialAuth.name,
          avatarUrl: userAvatarUrl,
          role,
          cpf,
          cnpj: role === "ACADEMIA" ? cpf : undefined,
          razaoSocial: role === "ACADEMIA" ? (razaoSocial || name) : undefined,
          nomeFantasia: role === "ACADEMIA" ? (nomeFantasia || name) : undefined,
          phone,
          professionTitle: role === "PERSONAL" ? professionTitle : undefined,
          professionalRegistrationId: role === "PERSONAL" ? professionalRegistrationId : undefined,
          professionalDocumentUrl,
        });

        if ("accessToken" in res && res.accessToken) {
          newUser = res.user;
        } else {
          throw new Error("Não foi possível concluir o cadastro social.");
        }
      } else {
        // Cadastro tradicional com senha
        newUser = await register({ 
          name, 
          email, 
          password, 
          role, 
          avatarUrl: userAvatarUrl,
          professionTitle: role === "PERSONAL" ? professionTitle : undefined, 
          cpf, 
          cnpj: role === "ACADEMIA" ? cpf : undefined,
          razaoSocial: role === "ACADEMIA" ? (razaoSocial || name) : undefined,
          nomeFantasia: role === "ACADEMIA" ? (nomeFantasia || name) : undefined,
          phone,
          professionalRegistrationId: role === "PERSONAL" ? professionalRegistrationId : undefined,
          professionalDocumentUrl
        });
      }

      setIsUploading(false);

      toast.success("Conta criada com sucesso!");
      if (newUser?.role === "ADMIN") {
        navigate("/admin");
      } else if (newUser?.role === "PERSONAL" || newUser?.role === "ACADEMIA") {
        navigate("/agenda-profissional");
      } else {
        navigate("/buscar");
      }
    } catch (err) {
      toast.error("Erro no cadastro", { description: (err as Error).message });
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-start">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-lg bg-muted/60 hover:bg-muted">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao início</span>
          </Link>
        </div>

        <Link to="/" className="flex items-center justify-center mb-6">
          <FinexLogo size="lg" />
        </Link>

        <div className="bg-transparent md:bg-card md:border md:border-border rounded-2xl p-2 md:p-8 md:shadow-card">
          <h1 className="font-display text-2xl font-bold mb-1">Criar conta</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Comece em menos de um minuto.
          </p>

          {/* Social Auth Banner se conectado */}
          {socialAuth && (
            <div className="mb-6 p-3.5 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    Conectado com {socialAuth.provider === "google" ? "Google" : "Apple"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {socialAuth.email}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setSocialAuth(null);
                  toast.info("Desvinculado. Você pode cadastrar com senha.");
                }}
              >
                Alterar
              </Button>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Eu sou</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                {roleOptions.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex-1 text-left p-3 rounded-lg border transition-all ${
                      role === r.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div className="font-semibold text-sm text-foreground">{r.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {r.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Campos Específicos para PROFISSIONAL */}
            {role === "PERSONAL" && (
              <>
                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl mb-3 text-xs text-secondary-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-secondary shrink-0" />
                  <span>Cadastre seus dados profissionais para ativação e validação do seu perfil.</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Suas Profissões / Especialidades *</Label>
                    <span className="text-xs font-semibold text-secondary">
                      {selectedProfessions.length > 0
                        ? `${selectedProfessions.length} selecionada(s)`
                        : "Selecione uma ou mais"}
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {availableProfessionsList.map((p) => {
                        const isSelected = selectedProfessions.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => toggleProfession(p)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-secondary text-secondary-foreground font-semibold shadow-sm ring-2 ring-secondary/30 scale-[1.02]"
                                : "bg-card text-muted-foreground border border-border hover:border-foreground/30 hover:text-foreground"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    {/* Adicionar outra especialidade se desejar */}
                    <div className="flex gap-2 pt-2 border-t border-border/40">
                      <Input
                        placeholder="Outra especialidade (ex: Treinador de Corrida)"
                        value={customProfession}
                        onChange={(e) => setCustomProfession(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomProfession();
                          }
                        }}
                        className="h-9 text-xs"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddCustomProfession}
                        className="h-9 text-xs shrink-0"
                      >
                        + Adicionar
                      </Button>
                    </div>
                  </div>

                  {selectedProfessions.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Perfil será apresentado como: <strong className="text-foreground">{selectedProfessions.join(", ")}</strong>
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="professionalRegistrationId">
                    {selectedProfessions.includes("Educador Físico") || selectedProfessions.includes("Personal Trainer")
                      ? "Número do Registro Profissional (CREF / outros) *"
                      : selectedProfessions.includes("Fisioterapeuta")
                      ? "Número do Registro Profissional (CREFITO / outros) *"
                      : selectedProfessions.includes("Nutricionista")
                      ? "Número do Registro Profissional (CRN / outros) *"
                      : "Número do Registro Profissional (ex: CREF, CRN, CREFITO) *"}
                  </Label>
                  <Input
                    id="professionalRegistrationId"
                    required
                    className="h-12"
                    value={professionalRegistrationId}
                    onChange={(e) => setProfessionalRegistrationId(e.target.value)}
                    placeholder="Ex: 000000-G/RS"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentFile">Comprovante de Registro (Foto/PDF) *</Label>
                  <Input
                    id="documentFile"
                    type="file"
                    required
                    accept="image/*,.pdf"
                    className="h-12 pt-3"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Anexe uma foto da sua carteira profissional ou documento do conselho para validação.
                  </p>
                </div>
              </>
            )}

            {/* Campos Específicos para ACADEMIA */}
            {role === "ACADEMIA" && (
              <>
                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl mb-3 text-xs text-secondary-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-secondary shrink-0" />
                  <span>Informe os dados comerciais da sua academia ou centro de treino.</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeFantasia">Nome Fantasia da Academia *</Label>
                  <Input 
                    id="nomeFantasia" 
                    required 
                    className="h-12" 
                    placeholder="Ex: FitLife Academia"
                    value={nomeFantasia} 
                    onChange={(e) => setNomeFantasia(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social (Opcional)</Label>
                  <Input 
                    id="razaoSocial" 
                    className="h-12" 
                    placeholder="Ex: FitLife Treinamento Esportivo LTDA"
                    value={razaoSocial} 
                    onChange={(e) => setRazaoSocial(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentFileAcademia">Alvará ou Contrato Social (Opcional)</Label>
                  <Input
                    id="documentFileAcademia"
                    type="file"
                    accept="image/*,.pdf"
                    className="h-12 pt-3"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Anexe alvará ou documento oficial para agilizar a verificação.
                  </p>
                </div>
              </>
            )}

            {(role === "PERSONAL" || role === "ACADEMIA") && (
              <div className="space-y-2 p-4 rounded-xl border border-border bg-card/60">
                <Label className="text-sm font-semibold text-foreground flex items-center justify-between">
                  <span>{role === "ACADEMIA" ? "Logotipo da Academia" : "Foto de Perfil Profissional"}</span>
                  <span className="text-xs text-muted-foreground font-normal">Recomendado</span>
                </Label>

                <div className="flex items-center gap-4 mt-2">
                  <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden shrink-0 group">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Camera className="w-6 h-6 mb-1 opacity-70" />
                        <span className="text-[10px]">Foto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1.5 border-border hover:bg-accent font-medium shadow-sm"
                        onClick={async () => {
                          if (isNativePlatform()) {
                            try {
                              const file = await captureNativePhoto({ source: "camera" });
                              if (file) handleAvatarChange(file);
                            } catch (err: any) {
                              toast.error("Não foi possível abrir a câmera", { description: err?.message });
                            }
                          } else {
                            cameraInputRef.current?.click();
                          }
                        }}
                      >
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        Tirar Foto (Câmera)
                      </Button>

                      {/* Input de câmera direta do celular/dispositivo */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)}
                      />

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1.5 font-medium shadow-sm"
                        onClick={async () => {
                          if (isNativePlatform()) {
                            try {
                              const file = await captureNativePhoto({ source: "photos" });
                              if (file) handleAvatarChange(file);
                            } catch (err: any) {
                              toast.error("Não foi possível abrir a galeria", { description: err?.message });
                            }
                          } else {
                            const fileInput = document.getElementById("avatarFileInput") as HTMLInputElement;
                            fileInput?.click();
                          }
                        }}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        {avatarPreview ? "Trocar imagem" : "Galeria / Arquivos"}
                      </Button>
                      <input
                        id="avatarFileInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)}
                      />

                      {avatarPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleAvatarChange(null)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Formatos JPG, PNG ou WEBP. Uma boa foto transmite mais confiança aos alunos!
                    </p>
                  </div>
                </div>

                <CameraCaptureModal
                  open={isCameraOpen}
                  onOpenChange={setIsCameraOpen}
                  onCapture={handleAvatarChange}
                  title={role === "ACADEMIA" ? "Logotipo / Foto da Academia" : "Foto de Perfil Profissional"}
                  description="Capture uma foto direta pela câmera ou webcam para seu perfil."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                {role === "ACADEMIA" ? "Nome do Responsável Legal *" : role === "PERSONAL" ? "Nome Completo do Profissional *" : "Nome completo *"}
              </Label>
              <Input 
                id="name" 
                required 
                className="h-12" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf">
                {role === "ACADEMIA" ? "CNPJ da Academia *" : "CPF *"}
              </Label>
              <Input 
                id="cpf" 
                required 
                className="h-12" 
                placeholder={role === "ACADEMIA" ? "00.000.000/0000-00" : "000.000.000-00"}
                value={cpf} 
                onChange={(e) => setCpf(formatCpfCnpj(e.target.value))} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp *</Label>
              <Input 
                id="phone" 
                required 
                className="h-12" 
                placeholder="(00) 00000-0000"
                value={phone} 
                onChange={(e) => setPhone(formatPhone(e.target.value))} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                required
                disabled={!!socialAuth}
                className={`h-12 ${socialAuth ? "bg-muted/70 cursor-not-allowed" : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!socialAuth && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <PasswordInput
                  id="password"
                  required
                  minLength={6}
                  className="h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            <Button type="submit" variant="hero" className="w-full h-12 text-base mt-2" disabled={loading || isUploading}>
              {loading || isUploading 
                ? "Criando conta..." 
                : socialAuth 
                ? "Concluir Cadastro" 
                : "Criar conta"}
            </Button>
          </form>

          {!socialAuth && (
            <>
              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs text-muted-foreground font-medium uppercase">Ou cadastre-se com</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-12 hover:bg-primary/5 hover:border-primary/40 transition-all font-semibold" 
                  onClick={async () => {
                    if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                      try {
                        const { triggerGoogleSignIn } = await import("@/services/googleAuth");
                        const profile = await triggerGoogleSignIn();
                        await handleOAuthSelected({
                          provider: "google",
                          name: profile.name,
                          email: profile.email,
                          avatarUrl: profile.picture,
                        });
                        return;
                      } catch (err: any) {
                        if (err?.message?.includes("closed") || err?.message?.includes("cancel")) {
                          return;
                        }
                        console.warn("Google sign in fallback:", err);
                      }
                    }
                    setOauthProvider("google");
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-12 hover:bg-primary/5 hover:border-primary/40 transition-all font-semibold" 
                  onClick={async () => {
                    if (import.meta.env.VITE_APPLE_CLIENT_ID) {
                      try {
                        const { triggerAppleSignIn } = await import("@/services/appleAuth");
                        const profile = await triggerAppleSignIn();
                        await handleOAuthSelected({
                          provider: "apple",
                          name: profile.name,
                          email: profile.email,
                          avatarUrl: profile.avatarUrl,
                        });
                        return;
                      } catch (err: any) {
                        if (err?.message?.includes("closed") || err?.message?.includes("cancel") || err?.message?.includes("popup_closed")) {
                          return;
                        }
                        console.warn("Apple sign in fallback:", err);
                      }
                    }
                    setOauthProvider("apple");
                  }}
                >
                  <svg className="w-5 h-5 mr-2 text-foreground fill-current" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.09 2.31-.86 3.59-.8 1.51.05 2.95.72 3.81 1.96-3.44 1.96-2.93 6.66.62 8.04-.76 1.77-1.85 3.87-3.1 5.06v-.09zm-3.32-14.7c.69-.95 1.13-2.16.92-3.41-1.11.07-2.38.74-3.1 1.67-.65.8-1.22 2.07-1 3.3 1.25.12 2.45-.63 3.18-1.56z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>

        </div>
      </div>

      <OAuthModal
        isOpen={!!oauthProvider}
        onClose={() => setOauthProvider(null)}
        provider={oauthProvider}
        onSuccess={handleOAuthSelected}
      />
    </div>
  );
};

export default Cadastro;
