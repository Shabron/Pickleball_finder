# Add project specific ProGuard/R8 rules here.
#
# Most libraries in this app (React Native core, Firebase, Room, Screens, SVG,
# Maps, safe-area-context) ship their own consumer rules inside their AARs, so
# these are the extra guards for things R8 cannot infer on its own — anything
# reached by reflection or from native/JNI code.

# ─── Keep line numbers for readable Play Console crash reports ───────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Annotations and generics are used at runtime by RN, Room and Gson-style
# reflection; stripping them breaks those lookups.
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,RuntimeVisible*Annotation*

# ─── React Native / JNI ──────────────────────────────────────────────────────
# Anything called from C++ is invisible to R8's reachability analysis.
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStripAny
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

-keep @com.facebook.proguard.annotations.DoNotStrip class * { *; }
-keep @com.facebook.common.internal.DoNotStrip class * { *; }
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

# TurboModules / Fabric components are resolved by name at runtime.
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }
-keep @com.facebook.react.module.annotations.ReactModule class * { *; }
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# The generated app-module registry for the New Architecture.
-keep class com.pickleballapp.** { *; }

# ─── Kotlin ──────────────────────────────────────────────────────────────────
-keep class kotlin.Metadata { *; }
-keepclassmembers class kotlinx.coroutines.** { volatile <fields>; }
-dontwarn kotlinx.coroutines.**

# ─── AndroidX Room (AsyncStorage's storage backend) ──────────────────────────
# Room's generated _Impl classes are instantiated reflectively by name.
-keep class * extends androidx.room.RoomDatabase { *; }
-keep class androidx.room.** { *; }
-dontwarn androidx.room.paging.**

# ─── Firebase Cloud Messaging / Notifee ──────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class io.invertase.firebase.** { *; }
-keep class app.notifee.** { *; }
-dontwarn com.google.firebase.**

# ─── OkHttp / Okio (React Native's networking stack) ─────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase
