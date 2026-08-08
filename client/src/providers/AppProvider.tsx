import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider } from "../context/SocketContext";
import { Toaster } from "../components/ui/sonner";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

const queryClient = new QueryClient();

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          {children}
          <Toaster closeButton />
        </SocketProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
