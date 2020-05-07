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

import android.content.Context;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Requests photo information.
 */
public class PhotoRequester {

    public interface ResponseListener {
        void receivedPhoto(Photo photo);
    }

    private Calendar mCalendar;
    private SimpleDateFormat mDateFormat;
    private ResponseListener mResponseListener;
    private Context mContext;
    private OkHttpClient mClient;
    private static final String BASE_PATH = "/planetary/apod?";
    private static final String DATE_PARAMETER = "date=";
    private static final String DATE_FORMAT = "yyyy-MM-dd";
    private static final String API_KEY_PARAMETER = "&api_key=";
    private static final String MEDIA_TYPE_KEY = "media_type";
    private static final String MEDIA_TYPE_VIDEO_VALUE = "video";
    private boolean mLoadingData;

    public boolean isLoadingData() {
        return mLoadingData;
    }

    public PhotoRequester(Context context, App app, ResponseListener listener) {
        mContext = context;
        mResponseListener = listener;
        mClient = app.getHttpClient();
        mCalendar = Calendar.getInstance();
        mDateFormat = new SimpleDateFormat(DATE_FORMAT);
        mLoadingData = false;
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

        // build and call the request

        String urlRequest = mContext.getString(R.string.api_url) +
                BASE_PATH + DATE_PARAMETER + date;
        Log.i("ASTROPIKS_APP", urlRequest);

        final Request request = new Request.Builder().url(urlRequest).build();
        mLoadingData = true;

        mClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {

                // network failure
                Log.e("ASTROPIKS_APP", e.toString());

                Photo photo = new Photo();

                photo.setUrl(null);
                photo.setTitle("Network Failure");
                photo.setDesc("Unable to complete network request.");
                photo.setDate(null);

                mResponseListener.receivedPhoto(photo);
                mLoadingData = false;
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {

                // network response
                if (response.code() == 500) {
                    // skip this photo and try again

                    getPhoto();
                } else if (response.code() != 200) {
                    // unsuccessful response

                    Photo photo = new Photo();

                    photo.setUrl(null);
                    photo.setTitle("Unauthorized");
                    photo.setDesc("You are not authorized to access this information.");
                    photo.setDate(null);

                    mResponseListener.receivedPhoto(photo);
                    mLoadingData = false;
                    return;
                }

                try {
                    JSONObject photoJSON = new JSONObject(response.body().string());

                    if (photoJSON.has("error")) {
                        // bad photo data, likely a rate limit error

                        Photo photo = new Photo();

                        String code = photoJSON.getJSONObject("error").getString("code");
                        String msg = photoJSON.getJSONObject("error").getString("message");

                        photo.setUrl(null);
                        photo.setTitle(code);
                        photo.setDesc(msg);
                        photo.setDate(null);

                        mResponseListener.receivedPhoto(photo);
                        mLoadingData = false;
                    } else if (!photoJSON.getString(MEDIA_TYPE_KEY).equals(MEDIA_TYPE_VIDEO_VALUE)) {
                        // is an image, grab it

                        Photo photo = new Photo();

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
                        }

                        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                        Date day = null;
                        try {
                            day = dateFormat.parse(date);
                        } catch (ParseException e) {
                            e.printStackTrace();
                        }

                        photo.setUrl(url);
                        photo.setTitle(title);
                        photo.setDesc(desc);
                        photo.setDate(day);

                        mResponseListener.receivedPhoto(photo);
                        mLoadingData = false;
                    } else {
                        // probably a video, try again

                        getPhoto();
                    }
                } catch (JSONException e) {
                    // response body not expected JSON

                    Photo photo = new Photo();

                    photo.setUrl(null);
                    photo.setTitle("Invalid Photo");
                    photo.setDesc("Unexpected error when requesting photo.");
                    photo.setDate(null);

                    mResponseListener.receivedPhoto(photo);
                    mLoadingData = false;
                }
            }
        });
    }
}

// end of file
