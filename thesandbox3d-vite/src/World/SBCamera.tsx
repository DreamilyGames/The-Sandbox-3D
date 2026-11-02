import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useRef } from "react";

export const useCameraCtrlStore = create<
{
    orbitalCameraCtrl: OrbitControlsImpl | null,
    setOrbitalCameraCtrl: (ref: OrbitControlsImpl | null) => void
    orbitalCameraRotatingFlag: boolean,
    setOrbitalCameraRotatingFlag: (flag: boolean) => void
}>()(

    subscribeWithSelector((set) => ({
        orbitalCameraCtrl: null,
        setOrbitalCameraCtrl: (ctrl: OrbitControlsImpl | null) => set({ orbitalCameraCtrl: ctrl }),
        orbitalCameraRotatingFlag: false,
        setOrbitalCameraRotatingFlag: (flag: boolean) => set({ orbitalCameraRotatingFlag: flag })
    }))

)