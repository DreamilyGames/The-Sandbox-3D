import type { Ref } from 'react'
import { create } from 'zustand'

const useSelectModelStore = create((set) => 
({
    selectedModel: null,
    setSelectedModel: (model: Ref<any>) => set({ selectedModel: model }),
}))