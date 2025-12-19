import { Link } from 'react-router-dom';
import { Coins, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 group-hover:bg-gold/20 transition-colors">
            <Coins className="h-5 w-5 text-gold" />
          </div>
          <span className="font-display text-2xl font-semibold text-foreground">
            Numis<span className="text-gold">Gallery</span>
          </span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link to="/admin/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <Lock className="h-4 w-4" />
              Admin
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
