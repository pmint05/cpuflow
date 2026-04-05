import { Link } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { HomeIcon } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <h1 className="text-6xl font-bold mb-4 text-muted-foreground">404</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Page not found. The page you're looking for doesn't exist.
      </p>
      <Link to="/">
        <Button>
          <HomeIcon className="size-4 mr-2" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
