package com.salvatorecodes.inkoku;
import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.View;
import android.widget.FrameLayout;
public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  FrameLayout root = new FrameLayout(this);
  root.setBackgroundColor(Color.rgb(244,241,234));
  root.setOnApplyWindowInsetsListener((v, insets) -> {
   v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
   return insets.consumeSystemWindowInsets();
  });
  web = new WebView(this);
  web.setBackgroundColor(Color.rgb(244,241,234));
  web.getSettings().setJavaScriptEnabled(true);
  web.getSettings().setDomStorageEnabled(true);
  web.getSettings().setAllowFileAccess(false);
  web.getSettings().setAllowContentAccess(false);
  web.setWebViewClient(new WebViewClient() {
   @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, android.webkit.WebResourceRequest req) {
    if ("https".equals(req.getUrl().getScheme()) && "inkoku.local".equals(req.getUrl().getHost())) {
     String path = req.getUrl().getPath();
     if (path == null || path.equals("/")) path = "/index.html";
     if (path.contains("..")) return new android.webkit.WebResourceResponse("text/plain", "UTF-8", null);
     String mime = path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : "text/html";
     try { return new android.webkit.WebResourceResponse(mime, "UTF-8", getAssets().open("web" + path)); }
     catch (java.io.IOException e) { return new android.webkit.WebResourceResponse("text/plain", "UTF-8", null); }
    }
    return new android.webkit.WebResourceResponse("text/plain", "UTF-8", null);
   }
   @Override public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest r) { return true; }
  });
  root.addView(web, new FrameLayout.LayoutParams(-1, -1));
  setContentView(root);
  getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
  web.loadUrl("https://inkoku.local/");
 }
 @Override protected void onPause() { web.evaluateJavascript("window.pauseGame && window.pauseGame()", null); web.onPause(); super.onPause(); }
 @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
 @Override public void onBackPressed() { web.evaluateJavascript("window.goHome && window.goHome()", null); }
 @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }
}