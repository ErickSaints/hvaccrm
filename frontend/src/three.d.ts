declare module '@react-three/fiber' {
  export const Canvas: any;
  export function useFrame(callback: (state: any, delta: number) => void, priority?: number): void;
  export function createPortal(children: any, state: any): any;
  export function useThree(): any;
  export function useLoader(proto: any, url: string): any;
  export interface ReactThreeFiber {}
}

declare module '@react-three/drei' {
  export const OrbitControls: any;
  export const Float: any;
  export const ContactShadows: any;
  export const Environment: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      spotLight: any;
      pointLight: any;
    }
  }
}
