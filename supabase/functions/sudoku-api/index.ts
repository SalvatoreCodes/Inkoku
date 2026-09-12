import {replay,cleanState} from './validation.js';
import {dateSeed} from './engine.js';
const URL=Deno.env.get('SUPABASE_URL');
const SECRET=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const origins=new Set(['https://inkoku.local','http://127.0.0.1:4173','http://localhost:4173']);
async function db(path,body,method='GET',extra={}){
 const result=await fetch(URL+'/rest/v1/'+path,{method,headers:{apikey:SECRET,Authorization:'Bearer '+SECRET,'Content-Type':'application/json',Prefer:'return=representation',...extra},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const data=await result.json().catch(()=>null);
 if(!result.ok)throw new Error(data?.message||'Database request failed');
 return data;
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin');
 const headers={'Content-Type':'application/json','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS',...(origin&&origins.has(origin)?{'Access-Control-Allow-Origin':origin}:{})};
 const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return response({error:'Origin not allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return response({error:'Method not allowed'},405);
 try{
  const authorization=req.headers.get('authorization')||'';
  if(!authorization.startsWith('Bearer '))return response({error:'Sign in required'},401);
  const verified=await fetch(URL+'/auth/v1/user',{headers:{apikey:SECRET,Authorization:authorization}});
  if(!verified.ok)return response({error:'Session expired. Sign in again.'},401);
  const user=await verified.json();
  if(!user.id||user.is_anonymous)return response({error:'Account required'},401);
  const raw=await req.text();if(raw.length>250000)return response({error:'Request too large'},413);
  const body=JSON.parse(raw);
  let profiles=await db('sudoku_profiles?id=eq.'+user.id+'&select=*');
  if(!profiles.length){
   let name=String(user.user_metadata?.display_name||'').trim();
   if(!/^[A-Za-z0-9_ ]{3,20}$/.test(name))name='Player '+user.id.slice(0,8);
   try{profiles=await db('sudoku_profiles',{id:user.id,display_name:name},'POST');}
   catch{profiles=await db('sudoku_profiles?id=eq.'+user.id+'&select=*');if(!profiles.length)profiles=await db('sudoku_profiles',{id:user.id,display_name:'Player '+user.id.slice(0,8)},'POST');}
  }
  const profile=profiles[0];
  if(body.action==='me')return response({display_name:profile.display_name,state:Object.keys(profile.state).length?{...profile.state,xp:Math.max(profile.state.xp||0,profile.ranked_xp)}:null});
  if(body.action==='profile'){
   const state=cleanState(body.state);await db('rpc/sudoku_save',{p_user:user.id,p_state:state},'POST');return response({ok:true});
  }
  if(body.action==='rename'){
   const name=String(body.displayName||'').trim();if(!/^[A-Za-z0-9_ ]{3,20}$/.test(name))return response({error:'Use 3–20 letters, numbers, spaces, or underscores.'},400);
   try{await db('sudoku_profiles?id=eq.'+user.id,{display_name:name},'PATCH');}catch{return response({error:'Display name already taken.'},409);}
   return response({ok:true});
  }
  if(body.action==='scores'){
   const period=body.period==='week'?'week':'all',difficulty=Number(body.difficulty);
   if(!Number.isInteger(difficulty)||difficulty< -1||difficulty>6)return response({error:'Invalid difficulty'},400);
   return response(await db('rpc/sudoku_board',{p_user:user.id,p_period:period,p_difficulty:difficulty},'POST'));
  }
  if(body.action==='start'){
   const difficulty=body.daily?2:Number(body.difficulty);
   if(!Number.isInteger(difficulty)||difficulty<0||difficulty>6)return response({error:'Invalid difficulty'},400);
   const recent=await db('sudoku_runs?user_id=eq.'+user.id+'&started_at=gte.'+encodeURIComponent(new Date(Date.now()-3600000).toISOString())+'&select=id&limit=121');
   if(recent.length>=120)return response({error:'Too many puzzles. Try again later.'},429);
   const daily=body.daily?new Date().toISOString().slice(0,10):null;
   if(daily){const completed=await db('sudoku_scores?user_id=eq.'+user.id+'&daily=eq.'+daily+'&select=run_id&limit=1');if(completed.length)return response({error:'Daily challenge already completed.'},409);}
   const seed=daily?dateSeed(daily):crypto.getRandomValues(new Uint32Array(1))[0];
   const [run]=await db('sudoku_runs',{user_id:user.id,difficulty,seed,daily},'POST');
   return response({id:run.id,seed,daily,difficulty});
  }
  if(body.action==='finish'){
   if(typeof body.id!=='string'||!/^[a-f0-9-]{36}$/.test(body.id))return response({error:'Invalid run'},400);
   const [run]=await db('sudoku_runs?id=eq.'+body.id+'&user_id=eq.'+user.id+'&select=*');
   if(!run)return response({error:'Run not found'},404);
   if(run.status==='won'){const [score]=await db('sudoku_scores?run_id=eq.'+body.id+'&select=xp');return response({xp:score.xp,duplicate:true});}
   if(Date.now()-new Date(run.started_at).getTime()>86400000)return response({error:'Ranked run expired after 24 hours.'},400);
   const validated=replay(run,body.events);
   return response(await db('rpc/sudoku_finish',{p_user:user.id,p_run:run.id,p_mistakes:validated.mistakes},'POST'));
  }
  return response({error:'Unknown action'},400);
 }catch(error){return response({error:error.message||'Request failed'},400);}
});
