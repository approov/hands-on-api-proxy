# TROUBLESHOOTING

## MOBILE APP

### Images not loading

First of all double check that you can access the internet from the device you are running this demo, and next check that you have given the internet permissions for this mobile app.

#### For All Steps

Ensure that your `api_url` is properly set in `config.xml` to `https://api.nasa.gov`.

#### For Step 0

Ensure that your `api_key` is properly set in the `secrets.xml` file, and not in another file.

#### For Step 1

If running in the mobile app on the emulator and the proxy in localhost, ensure that your `api_url` is set to `http://10.0.2.2:8080/api.nasa.gov` in the `config.xml` resources file.


## API SERVER


#### For Step 1

Ensure that your `.env` file has the correct values for:

```
ASTROPIK_HTTP_PORT=8080

ASTROPIK_PUBLIC_DOMAIN=localhost

NASA_PROTOCOL=https

NASA_HOST=api.nasa.gov

NASA_API_KEY=your-nasa-api-key-here
```


## MANUALLY TESTING THE NASA API

Open a browser or Postman, and try to access the NASA service, replacing DEMO_KEY in the screenshot below with your own key:

```
curl -i https://api.nasa.gov/planetary/apod?api_key=YOUR_NASA_API_KEY_HERE
```

and if your Nasa API key is correct you should get the image of the day, something like:

```json
{
  "date": "2020-04-01",
  "explanation": "Is this asteroid Arrokoth or a potato? Perhaps...",
  "hdurl": "https://apod.nasa.gov/apod/image/2004/PotatoPod_Sutton_5332.jpg",
  "media_type": "image",
  "service_version": "v1",
  "title": "Asteroid or Potato?",
  "url": "https://apod.nasa.gov/apod/image/2004/PotatoPod_Sutton_960.jpg"
}
```

otherwise your API key may be wrong:

```json
{
  "error": {
    "code": "API_KEY_INVALID",
    "message": "An invalid api_key was supplied. Get one at https://api.nasa.gov:443"
  }
}
```
