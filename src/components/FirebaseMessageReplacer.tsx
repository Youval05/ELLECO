'use client';

import { useEffect, useState } from 'react';

export default function FirebaseMessageReplacer() {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Supprimer immédiatement les messages d'avertissement
    const style = document.createElement('style');
    style.innerHTML = `
      div[style*="background-color: rgb(255, 244, 229)"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Détecter le message de succès et afficher notre propre message
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.style.backgroundColor === 'rgb(232, 245, 233)') {
              // Supprimer le message original
              if (node.parentNode) {
                node.parentNode.removeChild(node);
              }
              // Afficher notre propre message
              setShowSuccess(true);
              // Le cacher après 5 secondes
              setTimeout(() => setShowSuccess(false), 5000);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, []);

  if (!showSuccess) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgb(232, 245, 233)',
        color: 'rgb(30, 70, 32)',
        padding: '12px 24px',
        borderRadius: '0 0 4px 4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        style={{
          width: '20px',
          height: '20px',
          fill: 'currentColor'
        }}
      >
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
      Firebase connecté avec succès !
    </div>
  );
}
