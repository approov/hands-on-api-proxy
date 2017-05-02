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

import android.content.Context;
import android.content.Intent;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;

import java.util.List;

/**
 * Adapts photo gallery for a recycler view grid.
 */
public class PhotoGalleryAdapter extends RecyclerView.Adapter<PhotoGalleryAdapter.PhotoHolder> {

    private List<Photo> mPhotos;
    private App mApp;

    public PhotoGalleryAdapter(List<Photo> photos, App app) {
        mPhotos = photos;
        mApp = app;
    }

    @Override
    public PhotoHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View inflatedView = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_photo_gallery, parent, false);
        return new PhotoHolder(inflatedView, mApp);
    }

    @Override
    public void onBindViewHolder(PhotoHolder holder, int position) {
        Photo itemPhoto = mPhotos.get(position);
        holder.bindPhoto(itemPhoto);
    }

    @Override
    public int getItemCount() {
        return mPhotos.size();
    }

    public static class PhotoHolder extends RecyclerView.ViewHolder implements View.OnClickListener {

        private ImageView mItemImage;
        private Photo mPhoto;
        private App mApp;

        public PhotoHolder(View v, App app) {
            super(v);

            mApp = app;

            mItemImage = (ImageView) v.findViewById(R.id.item_image);
            v.setOnClickListener(this);
        }

        public void bindPhoto(Photo photo) {
            mPhoto = photo;
            if (mPhoto.getUrl() != null) {
                mApp.getImageDownloader()
                        .load(mPhoto.getUrl())
                        //.error(R.drawable.no_image)
                        .into(mItemImage);
            } else {
                mItemImage.setImageResource(R.drawable.no_image);
            }
        }

        @Override
        public void onClick(View v) {
            Context context = itemView.getContext();
            Intent intent = PhotoDetailActivity.newIntent(context, mPhoto.getId());
            context.startActivity(intent);
        }
    }
}

// end of file
