import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CoinFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  yearFrom: string;
  onYearFromChange: (value: string) => void;
  yearTo: string;
  onYearToChange: (value: string) => void;
  originality: string;
  onOriginalityChange: (value: string) => void;
  onClear: () => void;
  countries: string[];
}

export function CoinFilters({
  search,
  onSearchChange,
  country,
  onCountryChange,
  yearFrom,
  onYearFromChange,
  yearTo,
  onYearToChange,
  originality,
  onOriginalityChange,
  onClear,
  countries,
}: CoinFiltersProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-elegant">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gold" />
        <h2 className="font-display text-lg font-semibold">Filtros</h2>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar moedas..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Country */}
        <Select value={country} onValueChange={onCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os países</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year From */}
        <Input
          type="number"
          placeholder="Ano de"
          value={yearFrom}
          onChange={(e) => onYearFromChange(e.target.value)}
        />

        {/* Year To */}
        <Input
          type="number"
          placeholder="Ano até"
          value={yearTo}
          onChange={(e) => onYearToChange(e.target.value)}
        />

        {/* Originality */}
        <Select value={originality} onValueChange={onOriginalityChange}>
          <SelectTrigger>
            <SelectValue placeholder="Originalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Original">Original</SelectItem>
            <SelectItem value="Réplica">Réplica</SelectItem>
            <SelectItem value="Restaurada">Restaurada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClear}>
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
