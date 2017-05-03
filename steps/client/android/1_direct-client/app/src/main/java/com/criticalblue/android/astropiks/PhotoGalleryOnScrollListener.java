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

import android.support.v7.widget.GridLayoutManager;
import android.support.v7.widget.RecyclerView;

/**
 * Listens for scrolling within photo gallery recycler view.
 *
 * This listener is derived from the Codepath cliffnote at
 * https://guides.codepath.com/android/Endless-Scrolling-with-AdapterViews-and-RecyclerView.
 */
public abstract class PhotoGalleryOnScrollListener extends RecyclerView.OnScrollListener {
    private int visibleThreshold = 1;
    private int previousTotalItemCount = 0;
    private boolean loading = true;

    GridLayoutManager mGridLayoutManager;

    public PhotoGalleryOnScrollListener(GridLayoutManager gridLayoutManager) {
        this.mGridLayoutManager = gridLayoutManager;
        visibleThreshold = visibleThreshold * gridLayoutManager.getSpanCount();
    }

    @Override
    public void onScrolled(RecyclerView view, int dx, int dy) {
        int lastVisibleItemPosition = 0;
        int totalItemCount = mGridLayoutManager.getItemCount();

        lastVisibleItemPosition = ((GridLayoutManager) mGridLayoutManager).findLastVisibleItemPosition();

        // invalidated list?
        if (totalItemCount < previousTotalItemCount) {
            this.previousTotalItemCount = totalItemCount;
            if (totalItemCount == 0) {
                this.loading = true;
            }
        }

        // still loading?
        if (loading && (totalItemCount >= previousTotalItemCount + visibleThreshold)) {
            loading = false;
            previousTotalItemCount = totalItemCount;
        }

        // need to oad more?
        if (!loading && (lastVisibleItemPosition + visibleThreshold) > totalItemCount) {
            onLoadMore(visibleThreshold, view);
            loading = true;
        }
    }

    public void resetState() {
        this.previousTotalItemCount = 0;
        this.loading = true;
    }

    /**
     * Loads more photos.
     *
     * @param nphotos # of photos to load.
     * @param view    recycler view.
     */
    public abstract void onLoadMore(int nPhotos, RecyclerView view);
}

// end of file
