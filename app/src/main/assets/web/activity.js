export function createActivityTracker(onChange){
 const active=new Map();let next=0;
 return {
  begin(label){
   const id=++next;active.set(id,label);onChange({count:active.size,label});
   let ended=false;
   return ()=>{if(ended)return;ended=true;active.delete(id);onChange({count:active.size,label:[...active.values()].at(-1)||''});};
  }
 };
}
