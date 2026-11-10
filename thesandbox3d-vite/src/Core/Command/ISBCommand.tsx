export interface ISBCommand 
{
    Execute(): void;
    Undo(): void;
    Description?: string;
}