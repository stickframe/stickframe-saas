// 
// StickFrame useEventBus React Hook Wrapper
// 

import { useEffect } from 'react';
import { eventBus } from '../services/eventBus/eventBus';

/**
 * Hook para se inscrever em um evento específico do EventBus.
 * 
 * @param {string} eventType - Tipo do evento (do EVENT_TYPES) ou '*' para escutar todos os eventos.
 * @param {function} callback - Função chamada quando o evento é disparado.
 */
export const useEventBus = (eventType, callback) => {
  useEffect(() => {
    if (!eventType || !callback) return;
    const unsubscribe = eventBus.subscribe(eventType, callback);
    return () => unsubscribe();
  }, [eventType, callback]);
};

/**
 * Helper direto para publicar eventos no barramento.
 */
export const publishEvent = (eventData) => {
  return eventBus.publish(eventData);
};
