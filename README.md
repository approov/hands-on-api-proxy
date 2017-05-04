# Hands On Mobile API Security: Get Rid of Client Secrets

## Introduce an API Key Proxy to Improve Mobile Security

API keys and other secrets poorly hidden inside mobile apps are a common source of mobile insecurity. You can do better.

In this tutorial, you will work with a simple photo client which uses an API key to access the NASA picture of the day service. 
An API Proxy introduced between your client and the picture service will remove the need for storing and protecting the API key on the client. 
In addition to improved security, this approach offers some benefits in manageability and scalability.

During the tutorial, you will modify an Android client and Node.js proxy server. For demonstration purposes, 
both an Android client emulation and the node server can be run together on a single laptop.

I assume that you have some very basic familiarity with Android and can read Java and Javascript. 
All code is provided, so it should be possible to follow along even if you have limited experience in these environments.

## The Astropiks Mobile App

The Astropiks mobile app is a relatively simple networked Android client with two main screens. 
The initial screen displays a gallery of recent NASA picture of the day images. 
Clicking on an image brings up a detailed screen containing the full image and its description.

Gallery and Detail Screens

The app uses NASA’s picture of the day API to retrieve images and descriptions. 
To access the service, the API requires a registered API key which will be initially stored in the client app.

## Get Started

1. **Download the [Approov demo archive](https://www.approov.io/demo-reg.html)**.
2. **Obtain a [NASA API key](https://api.nasa.gov/)**.
3. **See indiviudal client and server READMEs contain additional information**.

**Follow the tutorial article for more complete instructions.**