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

import android.os.Bundle;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class PhotoGalleryFragment extends Fragment implements PhotoRequester.ResponseListener {
    private static final String TAG = "PhotoGalleryFragment";
    private static final int SPAN = 2;

    private List<Photo> mPhotos = new ArrayList<>();
    private PhotoRequester mPhotoRequester;
    private GridLayoutManager mGridLayoutManager;
    private PhotoGalleryAdapter mPhotoGalleryAdapter;
    private App mApp;

    public static PhotoGalleryFragment newInstance() {
        return new PhotoGalleryFragment();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRetainInstance(true);

        // create model and data source
        mApp = (App) requireActivity().getApplication();

        mPhotos = PhotoManager.get().getPhotos();
        mPhotoRequester = new PhotoRequester(getActivity(), mApp, this);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.fragment_photo_gallery, container, false);

      RecyclerView mPhotoRecyclerView = (RecyclerView) v.findViewById(R.id.photo_recycler_view);
        mGridLayoutManager = new GridLayoutManager(getActivity(), SPAN);
        mPhotoRecyclerView.setLayoutManager(mGridLayoutManager);

      PhotoGalleryOnScrollListener mScrollListener = new PhotoGalleryOnScrollListener(mGridLayoutManager) {
        @Override
        public void onLoadMore(int nPhotos, RecyclerView view) {
          requestPhotos(nPhotos);
        }
      };

        // asociate model with recycler view

        mPhotoGalleryAdapter = new PhotoGalleryAdapter(mPhotos, mApp);
        mPhotoRecyclerView.setAdapter(mPhotoGalleryAdapter);

        mPhotoRecyclerView.addOnScrollListener(mScrollListener);

        return v;
    }

    @Override
    public void onStart() {
        super.onStart();

        // request first photo if empty
        if (mPhotos.size() == 0) {
            requestPhotos(SPAN);
        }
    }

    private void requestPhotos(int n) {
        for (int i = 0; i < n; ++i) {
            try {
                mPhotoRequester.getPhoto();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void receivedPhoto(final Photo photo) {
        requireActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mPhotos.add(photo);
                mPhotoGalleryAdapter.notifyItemInserted(mPhotos.size());
            }
        });
    }
}
