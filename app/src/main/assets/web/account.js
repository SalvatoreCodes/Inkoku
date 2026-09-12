import {createActivityTracker} from './activity.js';
import {BACKEND} from './backend-config.js';
const activity=createActivityTracker(detail=>window.dispatchEvent(new CustomEvent('sudoku-network',{detail})));
function requestLabel(path,body){
 if(path.includes('grant_type=password'))return 'Signing in…';
 if(path.includes('/signup'))return 'Creating account…';
 if(path.includes('/logout'))return 'Signing out…';
 if(path.includes('grant_type=refresh_token'))return 'Reconnecting…';
 if(path.includes('/auth/v1/user'))return body?'Updating password…':'Checking account…';
 return {start:'Preparing puzzle…',finish:'Posting score…',profile:'Saving profile…',rename:'Saving name…',scores:'Loading scores…',me:'Loading profile…'}[body?.action]||'Connecting…';
}
const SESSION_KEY='sudoku.auth.v1';
let session=null,refreshing=null;
try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch{}
export const configured=()=>!!BACKEND.url&&!!BACKEND.key;
function save(value){session=value;if(value)localStorage.setItem(SESSION_KEY,JSON.stringify(value));else localStorage.removeItem(SESSION_KEY);}
function changed(){window.dispatchEvent(new CustomEvent('sudoku-auth'));}
export const user=()=>session?.user??null;
export function friendlyError(error){
 if(error?.name==='AbortError')return 'Connection timed out. Try again.';
 if(error instanceof TypeError)return 'Connection unavailable. Try again when online.';
 return error?.message||'Something went wrong. Try again.';
}
async function request(path,body,{method='POST',token=null}={}){
 if(!configured())throw new Error('Online accounts are not configured yet.');
 const endActivity=activity.begin(requestLabel(path,body));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const headers={'apikey':BACKEND.key,'Content-Type':'application/json'};
  if(token)headers.Authorization='Bearer '+token;
  const response=await fetch(BACKEND.url+path,{method,headers,signal:controller.signal,...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const error=new Error(data.msg||data.error_description||data.message||data.error||'Request failed');error.status=response.status;throw error;}
  return data;
 }finally{clearTimeout(timer);endActivity();}
}
async function accept(data){
 if(!data.access_token)return false;
 save({...data,expires_at:data.expires_at||Math.floor(Date.now()/1000)+data.expires_in});
 changed();return true;
}
export async function signIn(email,password){await accept(await request('/auth/v1/token?grant_type=password',{email,password}));}
export async function signUp(email,password,username){
 const data=await request('/auth/v1/signup?redirect_to='+encodeURIComponent('sudoku://auth/callback'),{email,password,data:{display_name:username}});
 return accept(data);
}
export async function recover(email){throw new Error('Password reset emails are not enabled yet.');}
export async function token(){
 if(!session)throw new Error('Sign in to continue.');
 if(session.expires_at>Date.now()/1000+60)return session.access_token;
 if(!refreshing)refreshing=request('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token})
 .then(data=>{save({...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in});return data.access_token;})
 .catch(error=>{if(error.status===400||error.status===401){save(null);changed();}throw error;})
 .finally(()=>{refreshing=null;});
 return refreshing;
}
export async function signOut(){
 const current=session;save(null);changed();
 if(current)try{await request('/auth/v1/logout',undefined,{token:current.access_token});}catch{}
}
export async function changePassword(password){await request('/auth/v1/user',{password},{method:'PUT',token:await token()});}
export async function cloud(action,data={}){
 const access=await token();
 return request('/functions/v1/sudoku-api',{action,...data},{token:access});
}
export async function initAuth(){
 if(!session)return;
 try{const account=await request('/auth/v1/user',undefined,{method:'GET',token:await token()});save({...session,user:account});}
 catch(error){if(error.status===401){save(null);changed();}}
}
window.receiveAuth=async(raw)=>{
 try{
  const url=new URL(raw);if(url.protocol!=='sudoku:'||url.host!=='auth')return;
  const values=new URLSearchParams(url.hash.slice(1));
  if(values.get('error_description'))throw new Error(values.get('error_description'));
  const access=values.get('access_token'),refresh=values.get('refresh_token');
  if(!access||!refresh)return;
  const account=await request('/auth/v1/user',undefined,{method:'GET',token:access});
  await accept({access_token:access,refresh_token:refresh,user:account,expires_in:Number(values.get('expires_in')||3600)});
  if(values.get('type')==='recovery')window.dispatchEvent(new CustomEvent('sudoku-recovery'));
 }catch(error){window.dispatchEvent(new CustomEvent('sudoku-auth-error',{detail:friendlyError(error)}));}
};
