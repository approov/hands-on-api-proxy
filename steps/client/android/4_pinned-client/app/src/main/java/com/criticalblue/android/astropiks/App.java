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

    /**
     * Creates an SSL context useful for pinning certificates.
     */
    private class SSLContextPinner {
        private SSLContext sslContext;
        private TrustManager trustManager;

        public SSLContextPinner(String pemAssetName) {
            try {
                KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
                keyStore.load(null, null);
                InputStream certInputStream = getAssets().open(pemAssetName);
                BufferedInputStream bis = new BufferedInputStream(certInputStream);
                CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
                int idx = -1;
                while (bis.available() > 0) {
                    Certificate cert = certificateFactory.generateCertificate(bis);
                    keyStore.setCertificateEntry("" + ++idx, cert);
                    Log.i("App", "pinned " + idx + ": " + ((X509Certificate) cert).getSubjectDN());
                }
                TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
                trustManagerFactory.init(keyStore);
                TrustManager[] trustManagers = trustManagerFactory.getTrustManagers();
                trustManager = trustManagers[0];
                sslContext = SSLContext.getInstance("TLS");
                sslContext.init(null, trustManagers, null);
            } catch(Exception e) {
                sslContext = null;
                trustManager = null;
                Log.e("App", e.toString());
            }
        }

        public SSLContext getSSLContext() { return sslContext; }

        public X509TrustManager getX509TrustManager() { return (X509TrustManager) trustManager; }
    };

    /**
     * Passes any host name verification.
     *
     * There appear to be some issues when verifying absolute IP
     * addresses when using subjectAltNames in certs, so we
     * just pass everything for demonstration purposes.
     */
    private class NoHostnameVerifier implements HostnameVerifier {
        @Override
        public boolean verify(final String hostname, final SSLSession session) {
            return true;
        }
    };

    @Override
    public void onCreate (){
        super.onCreate();

        mPlatformSpecifics = new AndroidPlatformSpecifics(this);
        mAttestation = new ApproovAttestation(mPlatformSpecifics);

        try {
            SSLContextPinner pinner = new SSLContextPinner("cert.pem");
            mClient = new OkHttpClient.Builder()
                    .sslSocketFactory(pinner.getSSLContext().getSocketFactory(), pinner.getX509TrustManager())
                    .hostnameVerifier(new NoHostnameVerifier())
                    .addInterceptor(new ApproovInterceptor(mAttestation))
                    .build();
        } catch (Exception e) {
            Log.e("App", e.toString());
            Log.e("App", "Failed to pin connection");
            throw new IllegalStateException("Failed to pin connection:");
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
