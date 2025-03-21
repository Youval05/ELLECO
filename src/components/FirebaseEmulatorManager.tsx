'use client';

import { useEffect } from 'react';

export default function FirebaseEmulatorManager() {
  useEffect(() => {
    const removeAllFirebaseMessages = () => {
      // Supprimer tous les messages Firebase (orange et vert)
      const messages = document.querySelectorAll(
        'div[style*="background-color: rgb(255, 244, 229)"], ' + // orange warning
        'div[style*="background-color: rgb(232, 245, 233)"], ' + // green success
        'div[role="alert"]' // tous les messages d'alerte
      );
      
      messages.forEach(message => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      });
    };

    // Supprimer immédiatement
    removeAllFirebaseMessages();

    // Supprimer toutes les 100ms pendant les 10 premières secondes
    const interval = setInterval(removeAllFirebaseMessages, 100);
    setTimeout(() => clearInterval(interval), 10000);

    // Observer les changements du DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Si c'est un message Firebase, le supprimer immédiatement
            if (
              node.style.backgroundColor === 'rgb(255, 244, 229)' || // orange
              node.style.backgroundColor === 'rgb(232, 245, 233)' || // vert
              node.getAttribute('role') === 'alert'
            ) {
              if (node.parentNode) {
                node.parentNode.removeChild(node);
              }
            }
          }
        });
      });
    });

    // Démarrer l'observation avec des options étendues
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'role']
    });

    // Injecter des styles CSS pour masquer les messages
    const style = document.createElement('style');
    style.textContent = `
      div[style*="background-color: rgb(255, 244, 229)"],
      div[style*="background-color: rgb(232, 245, 233)"],
      div[role="alert"][style*="position: fixed"],
      .firebase-emulator-warning,
      #firebase-emulator-warning,
      [data-testid="firebase-emulator-warning"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        height: 0 !important;
        width: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
        z-index: -1 !important;
      }
    `;
    document.head.appendChild(style);

    // Nettoyer
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
