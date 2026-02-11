import { Canvas } from 'fabric'
import { create } from 'zustand'

interface FabricStore {
	fabricRef: React.RefObject<Canvas | null> | null
	setFabricRef: (ref: React.RefObject<Canvas | null>) => void
}

export const useFabric = create<FabricStore>(set => ({
	fabricRef: null,
	setFabricRef: ref => set({ fabricRef: ref }),
}))
