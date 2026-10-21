# Methods exposed to the page are invoked by WebView rather than ordinary
# Java call sites. Preserve their names and annotations when R8 optimizes the
# release build so the existing Giloa JavaScript bridge keeps working.
-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,AnnotationDefault
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# The bridge object is registered directly with WebView. Keeping this exact
# inner class avoids device/WebView-version differences in bridge discovery
# without disabling optimization for the rest of the application.
-keep class com.giloa.app.MainActivity$PhotoBridge { *; }
