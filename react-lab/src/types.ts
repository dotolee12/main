export type NoteInput = {title:string;place:string;body:string;lat:number;lng:number};
export type Note = NoteInput & {id:string;createdAt:string;updatedAt:string};
