import { useState } from 'react';

function ImageContent({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  return (
    !isError && (
      <div
        className={
          isLoading || isError
            ? 'h-0 overflow-hidden'
            : 'h-[200px] overflow-hidden transition-all duration-450 ease-in-out'
        }
      >
        <img
          src={src}
          alt={alt}
          onError={() => setIsError(true)}
          onLoad={() => setIsLoading(false)}
          className={className}
        />
      </div>
    )
  );
}

export default function Image({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  return <ImageContent key={src} src={src} alt={alt} className={className} />;
}
