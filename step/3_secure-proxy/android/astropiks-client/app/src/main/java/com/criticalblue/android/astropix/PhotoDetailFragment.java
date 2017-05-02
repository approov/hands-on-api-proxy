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

import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import java.text.SimpleDateFormat;
import java.util.UUID;

/**
 * Displays a photo.
 */
public class PhotoDetailFragment extends Fragment {

    private static final String ARG_POD_ID = "pod_id";

    private App mApp;
    private Photo mPhoto;
    private TextView mTitleView;
    private ImageView mImageView;
    private TextView mCaptionView;

    public static PhotoDetailFragment newInstance(UUID photoId) {
        Bundle args = new Bundle();
        args.putSerializable(ARG_POD_ID, photoId);

        PhotoDetailFragment fragment = new PhotoDetailFragment();
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mApp = ((App)getActivity().getApplication());
        UUID photoId = (UUID) getArguments().getSerializable(ARG_POD_ID);
        mPhoto = PhotoManager.get().getPhoto(photoId);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.fragment_photo_detail, container, false);

        mTitleView = (TextView) v.findViewById(R.id.photo_title);
        mTitleView.setText(getPhotoTitle(mPhoto));

        mImageView = (ImageView) v.findViewById(R.id.photo_image);
        if (mPhoto.getUrl() != null) {
            mApp.getImageDownloader(/*mImageView.getContext()*/)
                    .load(mPhoto.getUrl())
                    //.error(R.drawable.no_image)
                    .into(mImageView);
        } else {
            mImageView.setImageResource(R.drawable.no_image);
        }

        mCaptionView = (TextView) v.findViewById(R.id.photo_caption);
        mCaptionView.setText(getPhotoCaption(mPhoto));

        return v;
    }

    private String getPhotoTitle(Photo photo) {
        String title = getResources().getString(R.string.pod_missing_title);

        if (photo != null) {
            if (photo.getTitle() != null) {
                title = photo.getTitle();
            }
        }

        return title;
    }

    private String getPhotoCaption(Photo photo) {
        String day = getResources().getString(R.string.pod_missing_date);
        String sep = getResources().getString(R.string.pod_caption_sep);
        String exp = getResources().getString(R.string.pod_missing_desc);


        if (photo != null) {
            SimpleDateFormat formatter = new SimpleDateFormat(getResources().getString(R.string.pod_caption_date_fmt));
            if (photo.getDate() != null) {
                day = formatter.format(photo.getDate());
            }
            if (photo.getDesc() != null) {
                exp = photo.getDesc();
            }
        }

        if (day.equals("?")) {
            return exp;
        } else{
            return day + sep + exp;
        }
    }
}

// end of file
