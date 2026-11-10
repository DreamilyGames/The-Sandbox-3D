import * as THREE from 'three';
import { type ISBCommand } from '../ISBCommand';
import type { SBActor } from '../../../Actor/SBActor';

export class SBHideInEditorActorCommand implements ISBCommand 
{
  public description: string;
  private previousState: boolean;
  private newState: boolean;

  constructor(private actor: SBActor, hide: boolean) 
  {
    this.previousState = this.actor.useHiddenStore.getState().hidden;
    this.newState = hide;
    this.description = `${hide ? 'Hide' : 'Show'} Actor in Editor`;
  }

  Execute(): void 
  {
    if(!this.actor)
        return
    this.actor.useHiddenStore.setState({ hidden: this.newState });
  }

  Undo(): void 
  {
    if(!this.actor)
        return
    this.actor.useHiddenStore.setState({ hidden: this.previousState });
  }
}