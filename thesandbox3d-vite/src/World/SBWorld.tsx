import type { Ref } from 'react'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware';

export const useSelectModelStore = create()(
    subscribeWithSelector((set) => ({
        selectedModel: null,
        setSelectedModel: (model: Ref<any>) => set({ selectedModel: model }),
    }))
)