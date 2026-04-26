import { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { DIARY_REQUEST_TIMEOUT_MS, diaryAuthHeaders } from '@/lib/config';

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
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(
      () => controller.abort(),
      DIARY_REQUEST_TIMEOUT_MS
    );
    setIsLoading(true);
    setHasError(false);

    fetch(src, {
      headers: diaryAuthHeaders(),
      signal: controller.signal,
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
      })
      .finally(() => globalThis.clearTimeout(timeoutId));

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
      controller.abort();
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
