import { create } from 'zustand';
import { SBWorld } from './SBWorld';
import { subscribeWithSelector } from 'zustand/middleware';

//Initialize the singleton ONCE, protected against Vite HMR re-evaluations
let worldInstance: SBWorld;

if (import.meta.hot && import.meta.hot.data.worldInstance) 
{
  //Reuse the existing instance if Vite is hot-reloading
  worldInstance = import.meta.hot.data.worldInstance;
} 
else 
{
  //Otherwise, create it fresh on initial app boot
  worldInstance = new SBWorld();
}

//Save it to Vite's hot data cache so it survives file saves
if (import.meta.hot) 
{
  import.meta.hot.data.worldInstance = worldInstance;
}

export interface SBWorldStoreState 
{
  world: SBWorld;
}

export const useWorldStore = create<SBWorldStoreState>()
(
    subscribeWithSelector((set) => 
    ({
        world: worldInstance,
    }))
)