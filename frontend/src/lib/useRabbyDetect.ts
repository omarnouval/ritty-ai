'use client';

import { useState, useEffect } from 'react';

export function useRabbyDetect() {
  const [isRabby, setIsRabby] = useState(false);

  useEffect(() => {
    const check = () => {
      const eth = (window as any).ethereum;
      if (!eth) return false;
      // Rabby exposes isRabby flag
      if (eth.isRabby) return true;
      // Fallback: check provider name
      if (eth.providers?.some((p: any) => p.isRabby)) return true;
      return false;
    };
    setIsRabby(check());
  }, []);

  return isRabby;
}
