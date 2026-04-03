import { createContext, useContext } from 'react';

export const SettingsCtx = createContext({ settings:{}, C:{} });
export const useSettings = () => useContext(SettingsCtx);
