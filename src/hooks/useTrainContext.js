import { createContext, useContext } from 'react';

export const TrainModalCtx = createContext({ openModal: () => {} });
export const useTrainModal = () => useContext(TrainModalCtx);
