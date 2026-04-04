import { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

interface ProxiedImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProxiedImage({ src, alt, className = '' }: ProxiedImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    setIsLoading(true);
    setHasError(false);

    fetch(src, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load image');
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) throw new Error('Got HTML instead of image');
        return res.blob();
      })
      .then((blob) => {
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [src]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasError || !blobUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 ${className}`}>
        <ImageOff className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}
