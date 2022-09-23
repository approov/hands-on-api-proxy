# Hands On Mobile API Security: Get Rid of Client Secrets

[Approov](https://approov.io) is an API security solution used to verify that requests received by your backend services originate from trusted versions of your mobile apps.

## The Articles

This repository is part of the following articles:

* [Hands on Mobile API Security - Using a Proxy to Protect API Keys](https://approov.io/blog/hands-on-mobile-api-security-using-a-proxy-to-protect-api-keys)
* [Hands-on Mobile App and API Security - Runtime Secrets Protection](https://approov.io/blog/hands-on-mobile-app-and-api-security-runtime-secrets-protection)

### Hands on Mobile API Security - Using a Proxy to Protect API Keys

Quoted from the article introduction:

> In this tutorial, you will work with a simple photo client which uses an API key to access the NASA picture of the day service. An API Reverse Proxy introduced between your client and the NASA picture service will remove the need for storing and protecting the API key on the mobile app. In addition to improved API security, this approach offers some benefits in manageability and scalability.
>
> During the tutorial, you will modify an Android mobile app and a NodeJS API reverse proxy server. For demonstration purposes, both the Android mobile app and the API reverse proxy server can be run together on a single laptop, but to make it easier for you to follow along we will provide an online API reverve proxy server.
>
> I assume that you have some very basic familiarity with Android and can read Java and Javascript. All code is provided, so it should be possible to follow along even if you have limited experience in these environments.

### Hands-on Mobile App and API Security - Runtime Secrets Protection

Quoted from the article introduction:

> In a previous article we saw how to protect API keys by using Mobile App Attestation and delegating the API requests to a Proxy. This blog post will cover the situation where you can’t delegate the API requests to the Proxy, but where you want to remove the API keys (secrets) from being hard-coded in your mobile app to mitigate against the use of static binary analysis and/or runtime instrumentation techniques to extract those secrets.
>
> We will show how to have your secrets dynamically delivered to genuine and unmodified versions of your mobile app, that are not under attack, by using Mobile App Attestation to secure the just-in-time runtime secret delivery. We will demonstrate how to achieve this with the same Astropiks mobile app from the previous article. The app uses NASA's picture of the day API to retrieve images and descriptions, which requires a registered API key that will be initially hard-coded into the app.


## Approov Mobile App Attestation and API Security


### Why?

You can learn more about Approov, the motives for adopting it, and more detail on how it works by following this [link](https://approov.io/product). In brief, Approov:

* Ensures that accesses to your API come from official versions of your apps; it blocks accesses from republished, modified, or tampered versions
* Protects the sensitive data behind your API; it prevents direct API abuse from bots or scripts scraping data and other malicious activity
* Secures the communication channel between your app and your API with [Approov Dynamic Certificate Pinning](https://approov.io/docs/latest/approov-usage-documentation/#approov-dynamic-pinning). This has all the benefits of traditional pinning but without the drawbacks
* Removes the need for an API key in the mobile app
* Provides DoS protection against targeted attacks that aim to exhaust the API server resources to prevent real users from reaching the service or to at least degrade the user experience.


### How it works?

This is a brief overview of how the Approov Mobile App Attestation service and the API backend server fit together from a backend perspective. For a complete overview of how the mobile app and backend fit together with the Approov Mobile App Attestation service and the Approov SDK we recommend to read the [Approov overview](https://approov.io/product) page on our website.

#### Approov Mobile App Attestation Service

The Approov Mobile App Attestation service attests that a device is running a legitimate and tamper-free version of your mobile app.

* If the integrity check passes then a valid token is returned to the mobile app
* If the integrity check fails then a legitimate looking token will be returned

In either case, the app, unaware of the token's validity, adds it to every request it makes to the Approov protected API(s).

#### The API backend server

The API backend server ensures that the token supplied in the `Approov-Token` header is present and valid. The validation is done by using a shared secret known only to the Approov Mobile App Attestation service and the API backend server.

The request is handled such that:

* If the Approov Token is valid, the request is allowed to be processed by the API endpoint
* If the Approov Token is invalid, an HTTP 401 Unauthorized response is returned

You can choose to log JWT verification failures, but we left it out on purpose so that you can have the choice of how you prefer to do it and decide the right amount of information you want to log.


## Useful Links

If you wish to explore the Approov solution in more depth, then why not try one of the following links as a jumping off point:

* [Approov Free Trial](https://approov.io/signup)(no credit card needed)
* [Approov Get Started](https://approov.io/product/demo)
* [Approov QuickStarts](https://approov.io/docs/latest/approov-integration-examples/)
* [Approov Docs](https://approov.io/docs)
* [Approov Blog](https://approov.io/blog/)
* [Approov Resources](https://approov.io/resource/)
* [Approov Customer Stories](https://approov.io/customer)
* [Approov Support](https://approov.io/contact)
* [About Us](https://approov.io/company)
* [Contact Us](https://approov.io/contact)
