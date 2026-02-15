import { createContext, useContext, type ReactNode } from 'react';
import type { ServiceContainer } from './types';

const ServiceContainerContext = createContext<ServiceContainer | null>(null);

interface ServiceProviderProps {
  container: ServiceContainer;
  children: ReactNode;
}

export function ServiceProvider({ container, children }: ServiceProviderProps) {
  return (
    <ServiceContainerContext.Provider value={container}>
      {children}
    </ServiceContainerContext.Provider>
  );
}

export function useServices(): ServiceContainer {
  const ctx = useContext(ServiceContainerContext);
  if (!ctx) {
    throw new Error('useServices must be used within a <ServiceProvider>');
  }
  return ctx;
}
