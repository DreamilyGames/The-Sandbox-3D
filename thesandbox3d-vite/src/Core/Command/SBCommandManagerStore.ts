import { create } from 'zustand';
import { SBCommandManager } from './SBCommandManager';
import { subscribeWithSelector } from 'zustand/middleware';

//Initialize the singleton ONCE, protected against Vite HMR re-evaluations
let commandManagerInstance: SBCommandManager;

if (import.meta.hot && import.meta.hot.data.commandManagerInstance) 
{
  //Reuse the existing instance if Vite is hot-reloading
  commandManagerInstance = import.meta.hot.data.commandManagerInstance;
} 
else 
{
  //Otherwise, create it fresh on initial app boot
  commandManagerInstance = new SBCommandManager();
}

//Save it to Vite's hot data cache so it survives file saves
if (import.meta.hot) 
{
  import.meta.hot.data.commandManagerInstance = commandManagerInstance;
}

export interface SBCommandManagerStoreState 
{
  commandManager: SBCommandManager;
}

export const useCmdManagerStore = create<SBCommandManagerStoreState>()
(
    subscribeWithSelector((set) => 
    ({
        commandManager: commandManagerInstance,
    }))
)