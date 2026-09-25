import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { ExternalGym } from "@/services/externalGyms";
import { Button } from "@/components/ui/button";
import {
  LocateFixed,
  Maximize2,
  Minimize2,
  Building2,
  Layers,
  Compass,
} from "lucide-react";

interface GymsMapProps {
  gyms: ExternalGym[];
  userCoords?: { lat: number; lng: number } | null;
  selectedCity?: string;
  onSelectGym?: (gym: ExternalGym) => void;
  onInviteGym?: (gym: ExternalGym) => void;
  className?: string;
}

export const GymsMap: React.FC<GymsMapProps> = ({
  gyms,
  userCoords,
  selectedCity,
  onSelectGym,
  onInviteGym,
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapTheme, setMapTheme] = useState<"standard" | "hot">("standard");

  // Filtrar apenas academias com coordenadas válidas
  const gymsWithCoords = gyms.filter(
    (g) => typeof g.lat === "number" && typeof g.lng === "number" && !isNaN(g.lat) && !isNaN(g.lng)
  );

  // Inicializar o Mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Centro inicial: coordenadas do usuário, ou primeira academia, ou centro de referência SP
    const initialLat = userCoords?.lat ?? gymsWithCoords[0]?.lat ?? -23.5505;
    const initialLng = userCoords?.lng ?? gymsWithCoords[0]?.lng ?? -46.6333;
    const initialZoom = userCoords ? 14 : gymsWithCoords.length > 0 ? 13 : 5;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Camada de Azulejos (Tiles) 100% gratuita via OpenStreetMap Oficial (SEM necessidade de chave de API)
    const tileUrl =
      mapTheme === "hot"
        ? "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: mapTheme === "hot" ? "abc" : "",
    }).addTo(map);

    // Attribution discreto no canto inferior
    L.control
      .attribution({
        prefix: false,
        position: "bottomright",
      })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>')
      .addTo(map);

    // Layer Group para os marcadores
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Invalida tamanho após montar para evitar render cinza
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, [mapTheme]);

  // Atualizar Marcadores quando as academias ou localização mudarem
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    // 1. Marcador do Usuário (se houver GPS)
    if (userCoords && !isNaN(userCoords.lat) && !isNaN(userCoords.lng)) {
      const userHtml = `
        <div style="transform: translate(-50%, -50%);" class="relative flex items-center justify-center pointer-events-auto">
          <span class="absolute w-9 h-9 rounded-full bg-cyan-500/40 animate-ping"></span>
          <span class="relative flex h-6 w-6 rounded-full bg-cyan-500 border-2 border-white shadow-xl items-center justify-center">
            <span class="h-2.5 w-2.5 rounded-full bg-white"></span>
          </span>
        </div>
      `;

      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: userHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -16],
      });

      const userMarker = L.marker([userCoords.lat, userCoords.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).bindPopup(
        `<div class="p-2 font-sans text-xs">
          <p class="font-bold text-foreground">Sua Localização</p>
          <p class="text-muted-foreground text-[11px]">Você está aqui pelo GPS</p>
        </div>`
      );

      layer.addLayer(userMarker);
      bounds.push([userCoords.lat, userCoords.lng]);
    }

    // 2. Marcadores das Academias
    gymsWithCoords.forEach((gym) => {
      const isPartner = gym.isPartner;
      const markerColorClass = isPartner
        ? "bg-emerald-600 text-white border-white shadow-emerald-500/50"
        : "bg-slate-900 text-amber-400 border-slate-700 shadow-black/50";

      const badgeIcon = isPartner
        ? `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
        : `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`;

      const markerHtml = `
        <div style="transform: translate(-50%, -50%);" class="relative group cursor-pointer transition-transform duration-200 hover:scale-125 pointer-events-auto">
          <div class="flex items-center justify-center w-9 h-9 rounded-full border-2 shadow-xl ${markerColorClass}">
            ${badgeIcon}
          </div>
          ${
            isPartner
              ? `<span class="absolute -top-1 -right-1 flex h-3.5 w-3.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span></span>`
              : ""
          }
        </div>
      `;

      const gymIcon = L.divIcon({
        className: "custom-gym-marker",
        html: markerHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([gym.lat!, gym.lng!], {
        icon: gymIcon,
      });

      // Conteúdo formatado do Popup
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${gym.lat},${gym.lng}`;
      const distanceBadge = typeof gym.distanceKm === 'number'
        ? `<span class="inline-flex items-center text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">${gym.distanceKm} km</span>`
        : '';
      const partnerBadgeHtml = isPartner
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
            ✓ Parceira Finex
           </span>`
        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
            Mapeada
           </span>`;

      const popupContent = `
        <div class="p-2.5 font-sans min-w-[220px] max-w-[270px] text-foreground">
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <div class="flex items-center gap-1.5 flex-wrap">
              ${partnerBadgeHtml}
              ${distanceBadge}
            </div>
            <div class="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              ★ ${gym.googleRating || "4.8"}
            </div>
          </div>
          <h4 class="font-bold text-xs leading-tight mb-1 text-foreground">${gym.name}</h4>
          <p class="text-[11px] text-muted-foreground line-clamp-2 mb-2 leading-relaxed">${gym.address}</p>
          <div class="flex flex-col gap-1.5 pt-1.5 border-t border-border/50">
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" 
               class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] transition-opacity hover:opacity-90">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              Como Chegar (Navegador GPS)
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: "custom-leaflet-popup",
        maxWidth: 290,
      });

      marker.on("click", () => {
        if (onSelectGym) onSelectGym(gym);
      });

      layer.addLayer(marker);
      bounds.push([gym.lat!, gym.lng!]);
    });

    // Ajustar enquadramento inteligente
    if (userCoords && !isNaN(userCoords.lat) && !isNaN(userCoords.lng)) {
      // Prioriza a localização do usuário com zoom de bairro/cidade
      map.setView([userCoords.lat, userCoords.lng], 13);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [40, 40],
        maxZoom: 14,
      });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [gyms, userCoords]);

  // Ações de controle do mapa
  const handleRecenterUser = () => {
    if (mapInstanceRef.current && userCoords) {
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 14, { duration: 1 });
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const bounds: L.LatLngExpression[] = [];
    if (userCoords) bounds.push([userCoords.lat, userCoords.lng]);
    gymsWithCoords.forEach((g) => bounds.push([g.lat!, g.lng!]));

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), {
        padding: [40, 40],
        maxZoom: 14,
      });
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-border/80 shadow-md transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-none h-screen"
          : "h-[340px] sm:h-[420px] md:h-[480px]"
      } ${className}`}
    >
      {/* Container do Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-muted/40" />

      {/* Barra de Controles Superiores */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2">
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 shadow-sm text-xs font-semibold text-foreground">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span>
            {gymsWithCoords.length}{" "}
            {gymsWithCoords.length === 1 ? "academia no mapa" : "academias no mapa"}
          </span>
          {userCoords && (
            <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
              • GPS ativo
            </span>
          )}
        </div>

        {/* Botões de Ação Topo Direito */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMapTheme((t) => (t === "hot" ? "standard" : "hot"))}
            title="Alternar estilo do mapa"
            className="h-8 px-2.5 rounded-xl bg-background/90 backdrop-blur-md border-border/80 text-xs gap-1 shadow-sm hover:bg-background"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{mapTheme === "hot" ? "Padrão" : "Vibrante"}</span>
          </Button>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300);
            }}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            className="h-8 w-8 rounded-xl bg-background/90 backdrop-blur-md border-border/80 shadow-sm hover:bg-background"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Controles de Navegação e Zoom Flutuantes (Direita) */}
      <div className="absolute right-3 bottom-14 sm:bottom-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
        {userCoords && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleRecenterUser}
            title="Centralizar na minha localização"
            className="h-9 w-9 rounded-xl bg-background/90 backdrop-blur-md border-border/80 shadow-md text-cyan-600 dark:text-cyan-400 hover:bg-background"
          >
            <LocateFixed className="w-4 h-4" />
          </Button>
        )}

        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleFitAll}
          title="Ver todas as academias"
          className="h-9 w-9 rounded-xl bg-background/90 backdrop-blur-md border-border/80 shadow-md hover:bg-background"
        >
          <Compass className="w-4 h-4" />
        </Button>

        <div className="flex flex-col rounded-xl overflow-hidden border border-border/80 bg-background/90 backdrop-blur-md shadow-md">
          <button
            type="button"
            onClick={handleZoomIn}
            className="h-8 w-9 flex items-center justify-center text-sm font-bold border-b border-border/60 hover:bg-muted/60 transition-colors"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="h-8 w-9 flex items-center justify-center text-sm font-bold hover:bg-muted/60 transition-colors"
          >
            −
          </button>
        </div>
      </div>

      {/* Legenda Discreta no Rodapé Esquerdo */}
      <div className="absolute left-3 bottom-3 z-10 pointer-events-auto">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 shadow-sm text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Parceiras Finex
          </span>
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Mapeadas
          </span>
          {userCoords && (
            <span className="flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              Você
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
