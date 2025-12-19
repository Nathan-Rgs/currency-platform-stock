import { useState, useEffect } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { CoinCard } from '@/components/coins/CoinCard';
import { CoinFilters } from '@/components/coins/CoinFilters';
import { Button } from '@/components/ui/button';
import { coinsApi, Coin, PaginatedResponse } from '@/lib/api';
import { ChevronLeft, ChevronRight, Coins, Loader2 } from 'lucide-react';

const Index = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [originality, setOriginality] = useState('');
  const [countries, setCountries] = useState<string[]>([]);

  const fetchCoins = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, any> = { page, page_size: 12 };
      if (search) params.search = search;
      if (country && country !== 'all') params.country = country;
      if (yearFrom) params.year_from = parseInt(yearFrom);
      if (yearTo) params.year_to = parseInt(yearTo);
      if (originality && originality !== 'all') params.originality = originality;

      const response: PaginatedResponse<Coin> = await coinsApi.list(params);
      setCoins(response.items);
      setPagination({
        page: response.page,
        totalPages: response.total_pages,
        total: response.total,
      });

      // Extract unique countries for filter
      const uniqueCountries = [...new Set(response.items.map((c) => c.country))];
      setCountries((prev) => [...new Set([...prev, ...uniqueCountries])]);
    } catch (err) {
      setError('Não foi possível carregar as moedas. Verifique se o servidor está funcionando.');
      // Demo data for when API is unavailable
      setCoins([
        { id: 1, country: 'Brasil', year: 1900, face_value: 1, currency: 'Real', estimated_value: 150, originality: 'Original', condition: 'Excelente', created_at: '', updated_at: '' },
        { id: 2, country: 'Portugal', year: 1850, face_value: 5, currency: 'Escudo', estimated_value: 300, originality: 'Original', condition: 'Boa', created_at: '', updated_at: '' },
        { id: 3, country: 'Estados Unidos', year: 1921, face_value: 1, currency: 'Dollar', estimated_value: 500, originality: 'Original', condition: 'Excelente', created_at: '', updated_at: '' },
        { id: 4, country: 'França', year: 1789, face_value: 20, currency: 'Franc', estimated_value: 1200, originality: 'Restaurada', condition: 'Regular', created_at: '', updated_at: '' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoins(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, country, yearFrom, yearTo, originality]);

  const clearFilters = () => {
    setSearch('');
    setCountry('');
    setYearFrom('');
    setYearTo('');
    setOriginality('');
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2">
              <Coins className="h-5 w-5 text-gold" />
              <span className="text-sm font-medium text-gold">Coleção Numismática</span>
            </div>
            <h1 className="font-display text-5xl font-bold text-primary-foreground sm:text-6xl">
              Descubra Moedas <span className="text-gold">Raras</span>
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/70">
              Explore nossa coleção exclusiva de moedas históricas de todo o mundo.
              Cada peça conta uma história única da numismática mundial.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-12">
        {/* Filters */}
        <CoinFilters
          search={search}
          onSearchChange={setSearch}
          country={country}
          onCountryChange={setCountry}
          yearFrom={yearFrom}
          onYearFromChange={setYearFrom}
          yearTo={yearTo}
          onYearToChange={setYearTo}
          originality={originality}
          onOriginalityChange={setOriginality}
          onClear={clearFilters}
          countries={countries}
        />

        {/* Results count */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-muted-foreground">
            {pagination.total} moeda{pagination.total !== 1 ? 's' : ''} encontrada{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-lg border border-gold/20 bg-gold/5 p-4 text-center text-muted-foreground mt-8">
            <p>{error}</p>
            <p className="text-sm mt-2">Exibindo dados de demonstração</p>
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coins.map((coin, index) => (
              <div
                key={coin.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CoinCard coin={coin} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && coins.length === 0 && (
          <div className="py-20 text-center">
            <Coins className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 font-display text-xl font-semibold">Nenhuma moeda encontrada</h3>
            <p className="mt-2 text-muted-foreground">Tente ajustar os filtros de busca</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchCoins(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-4 text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchCoins(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 NumisGallery. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
