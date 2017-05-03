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

import android.app.Application;

import com.jakewharton.picasso.OkHttp3Downloader;
import com.squareup.picasso.Picasso;

import okhttp3.OkHttpClient;

/**
 * Represents the astropix application.
 *
 * This is only used to hold a long running Approov attestation object
 * throughout the running activities.
 */
public class App extends Application {
    OkHttpClient mClient = null;
    Picasso mDownloader = null;

    @Override
    public void onCreate (){
        super.onCreate();

        mClient = new OkHttpClient.Builder()
                .build();
        mDownloader = new Picasso.Builder(this)
                .downloader(new OkHttp3Downloader(mClient))
                .build();
    }

    /**
     * Returns a client for http requests.
     *
     * @returns an http client.
     */
    public OkHttpClient getHttpClient() {
        return mClient;
    }

    /**
     * Returns an image downloader for http requests.
     *
     * @returns an http downloader.
     */
    public Picasso getImageDownloader() {
        return mDownloader;
    }
}

// end of file
