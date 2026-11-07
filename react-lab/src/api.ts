import type {Note,NoteInput} from './types';
async function request<T>(path:string,method='GET',data?:NoteInput):Promise<T>{
 const response=await fetch(path,{method,headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});
 if(!response.ok)throw new Error(String(response.status));
 return response.json() as Promise<T>;
}
export const api={list:()=>request<Note[]>('/api/notes'),create:(v:NoteInput)=>request<Note>('/api/notes','POST',v),update:(id:string,v:NoteInput)=>request<Note>(`/api/notes/${id}`,'PUT',v),remove:(id:string)=>request<{ok:boolean}>(`/api/notes/${id}`,'DELETE')};
