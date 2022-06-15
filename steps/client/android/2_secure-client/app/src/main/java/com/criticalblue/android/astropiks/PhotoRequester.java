/*
 * Copyright (C) 2017 CriticalBlue, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.criticalblue.android.astropiks;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Objects;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Requests photo information.
 */
class PhotoRequester {

    private final String mRequestURL;
    private final App mApp;

    public interface ResponseListener {
        void receivedPhoto(Photo photo);
    }

    private final Calendar mCalendar;
    private final SimpleDateFormat mDateFormat;
    private final ResponseListener mResponseListener;
    private final Context mContext;
    private static final String BASE_PATH = "/planetary/apod?";
    private static final String DATE_PARAMETER = "&date=";
    private static final String DATE_FORMAT = "yyyy-MM-dd";
    private static final String API_KEY_PARAMETER = "api_key=";
    private static final String MEDIA_TYPE_KEY = "media_type";
    private static final String MEDIA_TYPE_VIDEO_VALUE = "video";

    public PhotoRequester(Context context, App app, ResponseListener listener) {
        mContext = context;
        mResponseListener = listener;
        mCalendar = Calendar.getInstance();
        mDateFormat = new SimpleDateFormat(DATE_FORMAT);
        mApp = app;
        mRequestURL = buildRequestURL();
    }

    public String buildRequestURL() {
      // build and the request URL with api_key and date parameters
      String urlRequest = mContext.getString(R.string.api_url) + BASE_PATH;
      urlRequest += API_KEY_PARAMETER + mContext.getString(R.string.api_key);
      return urlRequest;
    }

    /**
     * Requests a photo.
     *
     * @throws IOException if all else fails.
     */
    public void getPhoto() throws IOException {
      // grab the current calendar date and back up one day for next request
      final String date = mDateFormat.format(mCalendar.getTime());
      mCalendar.add(Calendar.DAY_OF_YEAR, -1);

      final Request request = new Request.Builder().url(mRequestURL + DATE_PARAMETER + date).build();

      makeRequest(request);
    }

    private void makeRequest(Request request) {
        OkHttpClient httpClient = mApp.getHttpClient();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                // network failure
                Log.e("ASTROPIKS_APP", e.toString());

                mResponseListener.receivedPhoto(buildPhoto(
                  null,
                  "Network Failure",
                  "Unable to complete network request.",
                  null
                ));
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {

                // network response
                if (response.code() == 500) {
                    // skip this photo and try again
                    getPhoto();
                } else if (response.code() != 200) {
                    // unsuccessful response;
                    Log.e("ASTROPIKS_APP", "Failed to get the photo. Response code: " + response.code());

                    mResponseListener.receivedPhoto(buildPhoto(
                      null,
                      "Unauthorized",
                      "You are not authorized to access this information.",
                      null
                    ));
                   return;
                }

                try {
                    JSONObject photoJSON = new JSONObject(Objects.requireNonNull(response.body()).string());

                    if (photoJSON.has("error")) {
                        // bad photo data, likely a rate limit error
                        String title = photoJSON.getJSONObject("error").getString("code");
                        String desc = photoJSON.getJSONObject("error").getString("message");

                        mResponseListener.receivedPhoto(buildPhoto(
                          null,
                          title,
                          desc,
                          null
                        ));

                    } else if (!photoJSON.getString(MEDIA_TYPE_KEY).equals(MEDIA_TYPE_VIDEO_VALUE)) {
                        // is an image, grab it
                        String url = null;
                        String title = null;
                        String desc = null;
                        String date = null;

                        try {
                            url = photoJSON.getString("url");
                            title = photoJSON.getString("title");
                            desc = photoJSON.getString("explanation");
                            date = photoJSON.getString("date");
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }

                        Date day = parseDate(date);

                        mResponseListener.receivedPhoto(buildPhoto(url, title, desc, day));
                    } else {
                        // probably a video, try again
                        getPhoto();
                    }
                } catch (JSONException e) {
                     // response body not expected JSON
                     mResponseListener.receivedPhoto(buildPhoto(
                       null,
                       "Invalid Photo",
                       "Unexpected error when requesting photo.",
                       null
                     ));
                }
            }
        });
    }

    private Date parseDate(String date) {
      @SuppressLint("SimpleDateFormat") SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
      try {
        return dateFormat.parse(date);
      } catch (ParseException e) {
        e.printStackTrace();
      }
      return null;
    }

    private Photo buildPhoto(String url, String title, String desc, Date day) {
        Photo photo = new Photo();
        photo.setUrl(url);
        photo.setTitle(title);
        photo.setDesc(desc);
        photo.setDate(day);

        return photo;
    }
}
