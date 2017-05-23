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
import com.criticalblue.attestationlibrary.TokenInterface;
import com.criticalblue.attestationlibrary.android.AndroidPlatformSpecifics;
import com.jakewharton.picasso.OkHttp3Downloader;
import com.squareup.picasso.Picasso;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

import okhttp3.CertificatePinner;
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
     * Passes any host name verification.
     *
     * There is some annoyances in trying to validate IP addresses instead of
     * DNS names, so we just pass everything to keep it simple.
     */
    private class NoHostnameVerifier implements HostnameVerifier {
        @Override
        public boolean verify(final String hostname, final SSLSession session) {
            return true;
        }
    };

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

        try {
            Log.i("PINNING", "get key store");
            KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
            keyStore.load(null, null);
            Log.i("PINNING", "read cert.pem");
            InputStream certInputStream = getAssets().open("cert.pem");
            BufferedInputStream bis = new BufferedInputStream(certInputStream);
            CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
            Log.i("PINNING", "process cert.pem");
            while (bis.available() > 0) {
                Log.i("PINNING", "new cert entry");
                Certificate cert = certificateFactory.generateCertificate(bis);
                keyStore.setCertificateEntry("example.com", cert);
                Log.i("PINNING", "cert=" + ((X509Certificate) cert).getSubjectDN());
            }
            Log.i("PINNING", "set cert for 10.0.2.2");
            TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            trustManagerFactory.init(keyStore);
            TrustManager[] trustManagers = trustManagerFactory.getTrustManagers();
            Log.i("PINNING", "set trust managers");
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustManagers, null);
            Log.i("PINNING", "set client");
            mClient = new OkHttpClient.Builder()
                    .sslSocketFactory(sslContext.getSocketFactory(), (X509TrustManager) trustManagers[0])
                    .hostnameVerifier(new NoHostnameVerifier())
                    .addInterceptor(new ApproovInterceptor(mAttestation))
                    .build();
            Log.i("PINNING", "built client");
        } catch (Exception e) {
            Log.e("pinned", e.toString());
            mClient = new OkHttpClient.Builder()
                    .addInterceptor(new ApproovInterceptor(mAttestation))
                    .build();
        }

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
