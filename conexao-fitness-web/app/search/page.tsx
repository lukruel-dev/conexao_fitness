import Link from 'next/link';
import { Search, MapPin, Star, Filter, Award } from 'lucide-react';

export default function SearchPage() {
  const mockResults = [
    {
      id: 1,
      type: 'Academia',
      isPremium: true,
      name: 'CrossFit Fronteira',
      category: 'CrossFit',
      address: 'Rua 15 de Novembro, 1890',
      description: 'Box de CrossFit oficial com coaches certificados. WODs diários e treinos em grupo.',
      priceRange: 'R$ 149-199/mês',
      rating: 4.9,
      reviews: 112,
      distance: '2.4 km',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 2,
      type: 'Academia',
      isPremium: false,
      name: 'Power Gym Uruguaiana',
      category: 'Musculação',
      address: 'Av. Presidente Vargas, 2890',
      description: 'Amplo espaço com equipamentos modernos, aulas de spinning, funcional e cross training.',
      priceRange: 'R$ 79-129/mês',
      rating: 4.6,
      reviews: 98,
      distance: '2 km',
      image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 3,
      type: 'Academia',
      isPremium: false,
      name: 'Academia Corpo em Forma',
      category: 'Musculação e Dança',
      address: 'Rua Duque de Caxias, 567',
      description: 'Academia acessível com foco em musculação, aulas de dança e horários flexíveis.',
      priceRange: 'R$ 69-99/mês',
      rating: 4.5,
      reviews: 76,
      distance: '2.2 km',
      image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 4,
      type: 'Personal',
      isPremium: false,
      name: 'Ricardo Santos',
      category: 'Musculação e Hipertrofia',
      address: 'Academias parceiras',
      description: 'Especialista em hipertrofia e emagrecimento, treinos personalizados focados em resultados.',
      priceRange: 'R$ 80-120/sessão',
      rating: 4.7,
      reviews: 53,
      distance: '1.5 km',
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 5,
      type: 'Personal',
      isPremium: false,
      name: 'Juliana Costa',
      category: 'Treino Funcional',
      address: 'Parque e espaços ao ar livre',
      description: 'Aulas dinâmicas e funcionais ao ar livre. Melhore seu condicionamento físico respirando ar puro.',
      priceRange: 'R$ 70-100/sessão',
      rating: 4.8,
      reviews: 41,
      distance: '1.4 km',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600&auto=format&fit=crop'
    }
  ];

  return (
    <div className="min-h-screen bg-[#1e2330]">
      {/* Header Search Section */}
      <section className="bg-gradient-to-b from-[#1a1d27] to-[#252a3a] pt-16 pb-12 px-4 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Encontre Seu Parceiro Fitness</h1>
            <p className="text-slate-400 text-lg">Conecte-se com academias e personal trainers em qualquer lugar que você esteja</p>
          </div>

          <div className="bg-[#1e2330] p-2 rounded-2xl md:rounded-full border border-slate-700/50 shadow-xl max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center px-4 py-2 gap-3 text-slate-400">
                <Search className="w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar academias e profissionais..." 
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 focus:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button className="bg-[#14b8a6] hover:bg-teal-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors">
              <Filter className="w-4 h-4" /> Todos
            </button>
            <button className="bg-[#232736] hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg font-medium transition-colors border border-slate-700">
              Academias
            </button>
            <button className="bg-[#232736] hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg font-medium transition-colors border border-slate-700">
              Personal Trainers
            </button>
            <button className="bg-[#232736] hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg font-medium transition-colors border border-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Mais Próximos
            </button>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-slate-400 mb-6">{mockResults.length} resultados encontrados</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockResults.map(result => (
            <div key={result.id} className="bg-[#161b24] border border-slate-800 rounded-2xl overflow-hidden hover:border-[#14b8a6]/50 transition-colors flex flex-col group">
              {/* Card Header (Image) */}
              <div className="relative h-48 w-full bg-slate-800">
                <img src={result.image} alt={result.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3">
                  <span className="bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-slate-700">
                    {result.type}
                  </span>
                </div>
                
                {result.isPremium && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg shadow-orange-500/20">
                      <Award className="w-3 h-3" /> Premium
                    </span>
                  </div>
                )}
                
                <div className="absolute bottom-3 left-3">
                  <span className="bg-slate-900/80 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-1 rounded-md border border-slate-700 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> {result.rating} <span className="text-slate-400 font-normal">({result.reviews})</span>
                  </span>
                </div>
                
                <div className="absolute bottom-3 right-3">
                  <span className="bg-[#4b6bfb] text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {result.distance}
                  </span>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-1">{result.name}</h3>
                <p className="text-[#14b8a6] text-sm font-medium mb-3">{result.category}</p>
                <div className="flex items-start gap-2 text-slate-400 text-sm mb-4">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{result.address}</p>
                </div>
                <p className="text-slate-300 text-sm line-clamp-3 mb-6">{result.description}</p>
                
                {/* Card Footer */}
                <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[#14b8a6] font-bold">{result.priceRange}</span>
                  <button className="bg-[#14b8a6] hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
