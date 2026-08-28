'use client';

import { useEffect } from 'react';

export function SuppressHydrationOverlay() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalError = console.error;
      console.error = (...args) => {
        const msg = args.join(' ');
        // Suppress hydration errors caused by browser extensions injecting attributes like bis_skin_checked
        if (
          msg.includes('Hydration failed') || 
          msg.includes('There was an error while hydrating') ||
          msg.includes('A tree hydrated but some attributes of the server rendered HTML didn\'t match') ||
          msg.includes('bis_skin_checked')
        ) {
          // Just silently swallow it to prevent the red Next.js dev overlay
          return;
        }
        originalError(...args);
      };
    }
  }, []);

  return null;
}
