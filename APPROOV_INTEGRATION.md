# APPROOV INTEGRATION


## APPROOV SDK

Now we need to download the Approov SDK from the Approov cloud service, by running from the root of this repo, this command:

```
approov sdk -getLibrary ./steps/client/android/2_secure-client/approov/approov.aar
```

## API DOMAIN

In order for Approov tokens to be generated for the mobile app we are about to release it is necessary to inform Approov about what backend is using, with:

```
approov api -add your-api.example.com
```

## APPROOV INITIAL CONFIG

The initial configuration is not built in the SDK in order to provide downstream flexibility. The Approov configuration is also dynamic, because we support Over The Air (OTA) updates, which enables us to configure the Approov SDK without the need to release a new mobile app version. Despite the OTA updates being possible, the initial configuration should be updated upon each mobile app release by retrieving a new one via the Approov CLI tool.

Download the Approov initial configuration with:

```
approov sdk -getConfig approov-initial.config 1&> /dev/null && cat approov-initial.config && rm -rf approov-initial.config
```

Now add it to the `strings.xml` by coping the output and paste it like:

```xml
<resources>
    <string name="app_name">AstroPiks</string>
    <string name="approov_config">APPROOV_INITIAL_CONFIG_HERE</string>
```

## APPROOV FRAMEWORK

Now that the Approov SDK is installed and ready to be used we will use an Appoov Framework to wrap it’s usage for the specific http stack being used by the mobile app, that is OkHttp4, and the Approov Framework was retrieved from this quick start, with this command:

```
curl -o ./steps/client/android/2_secure-client/app/src/main/java/com/criticalblue/approov/framework/okhttp/ApproovService.java https://raw.githubusercontent.com/approov/quickstart-android-java-okhttp/f9932a3fdd38eaf8275ac420def066350c8bc790/framework/src/main/java/io/approov/framework/okhttp/ApproovService.java
```
