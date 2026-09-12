package com.salvatorecodes.inkoku;
import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.View;
import android.widget.FrameLayout;
import org.json.JSONObject;

public class MainActivity extends Activity {
 private WebView web;
 private String pendingAuth;
 private boolean ready;
 private static final String[] ICONS={"Paper","Moss","Dusk","Ember","Midnight","Gold"};
 private void changeIcon(String requested) {
  String selected=null;
  for(String icon:ICONS)if(icon.equalsIgnoreCase(requested))selected=icon;
  if(selected==null)return;
  PackageManager pm=getPackageManager();
  pm.setComponentEnabledSetting(new ComponentName(this,getPackageName()+".Icon"+selected),PackageManager.COMPONENT_ENABLED_STATE_ENABLED,PackageManager.DONT_KILL_APP);
  for(String icon:ICONS)if(!icon.equals(selected))pm.setComponentEnabledSetting(new ComponentName(this,getPackageName()+".Icon"+icon),PackageManager.COMPONENT_ENABLED_STATE_DISABLED,PackageManager.DONT_KILL_APP);
 }
 private void receiveIntent(Intent intent){
  if(intent==null||intent.getData()==null)return;
  android.net.Uri uri=intent.getData();
  if("sudoku".equals(uri.getScheme())&&"auth".equals(uri.getHost())){pendingAuth=uri.toString();deliverAuth();}
 }
 private void deliverAuth(){
  if(ready&&pendingAuth!=null){web.evaluateJavascript("window.receiveAuth("+JSONObject.quote(pendingAuth)+")",null);pendingAuth=null;}
 }
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  FrameLayout root=new FrameLayout(this);
  root.setBackgroundColor(Color.rgb(244,241,234));
  root.setOnApplyWindowInsetsListener((v,insets)->{
   v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
   return insets.consumeSystemWindowInsets();
  });
  web=new WebView(this);
  web.setBackgroundColor(Color.rgb(244,241,234));
  web.getSettings().setJavaScriptEnabled(true);
  web.getSettings().setDomStorageEnabled(true);
  web.getSettings().setAllowFileAccess(false);
  web.getSettings().setAllowContentAccess(false);
  web.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.setWebViewClient(new WebViewClient(){
   @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view,android.webkit.WebResourceRequest req){
    if("https".equals(req.getUrl().getScheme())&&"inkoku.local".equals(req.getUrl().getHost())){
     String path=req.getUrl().getPath();
     if(path==null||path.equals("/"))path="/index.html";
     if(path.contains(".."))return new android.webkit.WebResourceResponse("text/plain","UTF-8",null);
     String mime=path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":"text/html";
     try{return new android.webkit.WebResourceResponse(mime,"UTF-8",getAssets().open("web"+path));}
     catch(java.io.IOException e){return new android.webkit.WebResourceResponse("text/plain","UTF-8",null);}
    }
    if("https".equals(req.getUrl().getScheme())&&!CloudConfig.HOST.isEmpty()&&CloudConfig.HOST.equals(req.getUrl().getHost()))return null;
    return new android.webkit.WebResourceResponse("text/plain","UTF-8",null);
   }
   @Override public boolean shouldOverrideUrlLoading(WebView v,android.webkit.WebResourceRequest r){
    android.net.Uri uri=r.getUrl();
    if(r.isForMainFrame()&&"https://inkoku.local/".equals(v.getUrl())&&"sudoku-action".equals(uri.getScheme())&&"icon".equals(uri.getHost())){
     String path=uri.getLastPathSegment();if(path!=null)changeIcon(path);
    }
    return true;
   }
   @Override public void onPageFinished(WebView v,String url){if("https://inkoku.local/".equals(url)){ready=true;deliverAuth();}}
  });
  root.addView(web,new FrameLayout.LayoutParams(-1,-1));
  setContentView(root);
  getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
  web.loadUrl("https://inkoku.local/");
  receiveIntent(getIntent());
 }
 @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);receiveIntent(intent);}
 @Override protected void onPause(){web.evaluateJavascript("window.pauseGame && window.pauseGame()",null);web.onPause();super.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override public void onBackPressed(){web.evaluateJavascript("window.goHome && window.goHome()",null);}
 @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
