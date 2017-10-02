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
import android.util.Log;

import com.criticalblue.attestationlibrary.ApproovAttestation;
import com.criticalblue.attestationlibrary.ApproovConfig;
import com.criticalblue.attestationlibrary.TokenInterface;
import com.jakewharton.picasso.OkHttp3Downloader;
import com.squareup.picasso.Picasso;

import java.io.IOException;
import java.net.MalformedURLException;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Represents the astropix application.
 *
 * This is only used to hold a long running Approov attestation object
 * throughout the running activities.
 */
public class App extends Application {
    final static String TAG = "APP";

    OkHttpClient mClient = null;
    Picasso mDownloader = null;

    /**
     * Adds Approov attestation token to http requests.
     */
    private class ApproovInterceptor implements Interceptor {

        /**
         * Intercepts the http request and adds the approov token to the request headers.
         *
         * @param chain the request chain.
         * @return the augmented request.
         * @throws IOException on I/O error.
         */
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request request = chain.request();

            TokenInterface.ApproovResults approovResults =
                    ApproovAttestation.shared().fetchApproovTokenAndWait(request.url().host());
            String token;
            if (approovResults.getResult() == ApproovAttestation.AttestationResult.SUCCESS) {
                token = approovResults.getToken();
                Log.i("ATTEST", "normal");
            } else {
                token = "NOTOKEN";
                Log.i("ATTEST", "abnormal: " + approovResults.getResult());
            }
            request = request.newBuilder().addHeader("approov", token).build();

            return chain.proceed(request);
        }
    }

    @Override
    public void onCreate (){
        super.onCreate();

        // Initialize the Approov SDK
        try {
            // Creates the configuration object for the Approov SDK based
            // on the Android application context
            ApproovConfig config =
                    ApproovConfig.getDefaultConfig(this.getApplicationContext());
            ApproovAttestation.initialize(config);
        } catch (IllegalArgumentException ex) {
            Log.e(TAG, ex.getMessage());
        } catch (MalformedURLException ex) {
            Log.e(TAG, ex.getMessage());
        }

        mClient = new OkHttpClient.Builder()
                .addInterceptor(new ApproovInterceptor())
                .build();
        mDownloader = new Picasso.Builder(this)
                .downloader(new OkHttp3Downloader(mClient))
                .build();
    }

    /**
     * Returns a client for http requests.
     *
     * @return an http client.
     */
    public OkHttpClient getHttpClient() {
        return mClient;
    }

    /**
     * Returns an image downloader for http requests.
     *
     * @return an http downloader.
     */
    public Picasso getImageDownloader() {
        return mDownloader;
    }
}

// end of file
