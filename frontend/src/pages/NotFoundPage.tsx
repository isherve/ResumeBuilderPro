import { Link } from 'react-router-dom';
import { FileText, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary mx-auto mb-6">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-6xl font-bold gradient-text mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Page not found</p>
        <Button asChild size="lg">
          <Link to="/"><Home className="h-5 w-5" /> Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
