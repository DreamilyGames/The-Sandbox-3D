import * as THREE from 'three';
import { type ISBCommand } from '../ISBCommand';
import type { SBActor } from '../../../Actor/SBActor';

export class SBTransformActorCommand implements ISBCommand 
{
  public description = 'Transform Actor';

  constructor(
    private pivotCtrlRef: React.RefObject<THREE.Group | null>,
    private oldMatrix: THREE.Matrix4,
    private newMatrix: THREE.Matrix4
  ) {
    // Clone matrices to prevent reference mutation bugs
    this.pivotCtrlRef = pivotCtrlRef;
    this.oldMatrix = oldMatrix.clone();
    this.newMatrix = newMatrix.clone();
  }

  Execute(): void 
  {
    if(this.pivotCtrlRef.current)
    {
      this.pivotCtrlRef.current.matrix.copy(this.newMatrix);
      this.pivotCtrlRef.current.updateMatrixWorld(true);
    }
  }

  Undo(): void 
  {
    if(this.pivotCtrlRef.current)
    {
      this.pivotCtrlRef.current.matrix.copy(this.oldMatrix);
      this.pivotCtrlRef.current.updateMatrixWorld(true);
    }
    
  }
}