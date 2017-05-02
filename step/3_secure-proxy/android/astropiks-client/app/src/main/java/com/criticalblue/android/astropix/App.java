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

package com.criticalblue.android.astropix;

import android.app.Application;

import com.criticalblue.attestationlibrary.ApproovAttestation;
import com.criticalblue.attestationlibrary.TokenInterface;
import com.criticalblue.attestationlibrary.android.AndroidPlatformSpecifics;
import com.jakewharton.picasso.OkHttp3Downloader;
import com.squareup.picasso.Picasso;

import java.io.IOException;

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
    ApproovAttestation mAttestation;
    AndroidPlatformSpecifics mPlatformSpecifics;

    OkHttpClient mClient = null;
    Picasso mDownloader = null;

    /**
     * Adds Approov attestation token to http requests.
     */
    private class ApproovInterceptor implements Interceptor {

        private ApproovAttestation mAttestation;

        public ApproovInterceptor(ApproovAttestation attestation) {
            mAttestation = attestation;
        }

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

            // add token header if fetch successful

            TokenInterface.ApproovResults approovResults = mAttestation.fetchApproovTokenAndWait();
            if (approovResults.getResult() == ApproovAttestation.AttestationResult.SUCCESS) {
                String token = approovResults.getToken();
                request = request.newBuilder().addHeader("approov", token).build();
            }

            return chain.proceed(request);
        }
    }

    @Override
    public void onCreate (){
        super.onCreate();

        mPlatformSpecifics = new AndroidPlatformSpecifics(this);
        mAttestation = new ApproovAttestation(mPlatformSpecifics);

        mClient = new OkHttpClient.Builder()
                .addInterceptor(new ApproovInterceptor(mAttestation))
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
