import { createContext, useContext } from 'react';

export const TrainModalCtx = createContext({ openModal: () => {} });
export const useTrainModal = () => useContext(TrainModalCtx);

export const TrainMenuCtx = createContext({ openMenu: () => {}, closeMenu: () => {} });
export const useTrainMenu = () => useContext(TrainMenuCtx);
