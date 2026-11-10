import { type ISBCommand } from './ISBCommand';

export class SBCommandManager
{
  private undoStack: ISBCommand[] = [];
  private redoStack: ISBCommand[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 50) 
  {
    this.maxHistory = maxHistory;
  }

  /**
   * Executes a command immediately and pushes it to the undo stack.
   * Clears the redo stack because a new action breaks the redo branch.
   */
  public Execute(command: ISBCommand): void 
  {
    command.Execute();
    this.undoStack.push(command);
    this.redoStack = [];

    // Enforce history limit
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  /**
   * Adds a command to the undo stack without executing it.
   * Clears the redo stack because a new action breaks the redo branch.
   */
  public Add(command: ISBCommand): void 
  {
    this.undoStack.push(command);
    this.redoStack = [];

    // Enforce history limit
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  public Undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;

    command.Undo();
    this.redoStack.push(command);
  }

  public Redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;

    command.Execute();
    this.undoStack.push(command);
  }

  public CanUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public CanRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public Clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}