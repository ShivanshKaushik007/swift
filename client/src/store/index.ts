// @ts-nocheck
import { create } from "zustand";
import { createAuthSlice } from "./slices/auth-slice";
import { createChatSlice } from "./slices/chat-slice";

export const useAppStore = create<any>()((...a: any[]) => ({ 
    ...createAuthSlice(...a),
    ...createChatSlice(...a),
 }));
