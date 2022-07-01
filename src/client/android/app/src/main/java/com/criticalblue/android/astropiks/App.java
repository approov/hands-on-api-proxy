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

// *** UNCOMMENT THE LINE BELOW FOR APPROOV ***
//import io.approov.service.okhttp.ApproovService;

/**
 * Represents the Astropiks application.
 *
 * This is only used to hold a long running Approov attestation object
 * throughout the running activities.
 */
public class App extends Application {

    @Override
    public void onCreate (){
        super.onCreate();

        // *** UNCOMMENT THE LINE BELOW FOR APPROOV ***
        //ApproovService.initialize(getApplicationContext(), getString(R.string.approov_config));

        // *** UNCOMMENT THE LINE BELOW FOR APPROOV RUNTIME SECRETS ***
        //ApproovService.addSubstitutionQueryParam("api_key");
    }

    /**
     * Returns a client for http requests.
     *
     * @return an http client.
     */
    public OkHttpClient getHttpClient() {
        // *** COMMENT THE LINE BELOW FOR APPROOV ***
        return new OkHttpClient.Builder().build();

        // *** UNCOMMENT THE LINE BELOW FOR APPROOV ***
        //return ApproovService.getOkHttpClient();
    }

    /**
     * Returns an image downloader for http requests.
     *
     * @return an http downloader.
     */
    public Picasso getImageDownloader() {
        return new Picasso.Builder(this)
            .downloader(new OkHttp3Downloader(getHttpClient()))
            .build();
    }
}
