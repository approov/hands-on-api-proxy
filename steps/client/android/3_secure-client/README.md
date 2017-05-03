# Hands On API Proxy Tutorial - Astropiks Android Client

This is a simple Android client implementation as part of the Hands On API Proxy tutorial.

## Get Started

The tutorial presumes you will be running the client in an Android emulator, but you can use a Android phone or tablet. The Android device should be running API 19 or higher.

1. **Setup [Android Studio and SDK](https://developer.android.com/studio/index.html)** - preferably version 2.3 or later.
2. **Open the Android project in this directory**.
3. **Update the app/src/main/res/values/apis.xml file as needed**.
4. **Add and update the app/src/main/res/values/secrets.xml file** - see the tutorial for more information.
5. **Add the approov.aar library to the project** - see the tutorial for more information.
6. **Sync/build the android project**.
7. **Ensure the corresponding proxy server is running** - see ../../../proxy-server/node/README.md.
8. **Install and run the debug APK on an emulator or Android device**.

**Follow the tutorial article for more complete instructions.**

## Dependencies

| **Dependency**                                            | **Use**                                     |
| --------------------------------------------------------- | ------------------------------------------- |
| com.squareup.okhttp3:okhttp:3.6.0                         | Handles HTTP requests                       |
| com.squareup.picasso:picasso:2.5.2                        | Downloads images over HTTP                  |
| com.jakewharton.picasso:picasso2-okhttp3-downloader:1.1.0 | Fixes picasso-okhttp dowloader glitch       |
| :approov module                                           | Provides Approov attestation SDK            |
