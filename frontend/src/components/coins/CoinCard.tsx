import { Link } from 'react-router-dom';
import { API_URL, Coin } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleDollarSign } from 'lucide-react';

interface CoinCardProps {
  coin: Coin;
}

export function CoinCard({ coin }: CoinCardProps) {
  const imageUrl = coin.image_url_front ? `${API_URL}/${coin.image_url_front.replace(/^\//, "")}` : null

  return (
    <Link to={`/coins/${coin.id}`}>
      <Card className="group overflow-hidden border-border bg-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
        <div className="aspect-square relative overflow-hidden bg-secondary">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${coin.country} ${coin.year}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CircleDollarSign className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold text-foreground truncate">
                {coin.country}
              </h3>
              <p className="text-sm text-muted-foreground">
                {coin.year} • {coin.face_value} {coin.currency}
              </p>
            </div>
            <Badge 
              variant="secondary" 
              className="shrink-0 bg-gold/10 text-gold-dark border-0"
            >
              {coin.originality}
            </Badge>
          </div>
          
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Valor estimado
            </span>
            <span className="font-display text-lg font-semibold text-gold">
              ${coin.estimated_value.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
