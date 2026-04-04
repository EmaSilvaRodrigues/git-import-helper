import floripa1 from '@/assets/floripa-1.jpg';
import floripa2 from '@/assets/floripa-2.jpg';
import floripa3 from '@/assets/floripa-3.jpg';
import floripa4 from '@/assets/floripa-4.jpg';

const images = [floripa1, floripa2, floripa3, floripa4];

interface BackgroundImageProps {
  imageIndex?: number;
  children: React.ReactNode;
  overlay?: 'light' | 'medium' | 'dark';
}

export function BackgroundImage({ 
  imageIndex = 1, 
  children, 
  overlay = 'medium' 
}: BackgroundImageProps) {
  const image = images[(imageIndex - 1) % images.length];
  
  const overlayClasses = {
    light: 'bg-white/40',
    medium: 'bg-white/60',
    dark: 'bg-white/80',
  };

  return (
    <div className="relative min-h-screen">
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className={`fixed inset-0 ${overlayClasses[overlay]} backdrop-blur-sm`} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
