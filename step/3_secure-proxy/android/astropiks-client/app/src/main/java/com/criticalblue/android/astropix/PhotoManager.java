/*
 * Copyright (c) 2016 Razeware LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

package com.criticalblue.android.astropix;

import android.content.Context;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Manages the photo collection (singleton).
 */
public class PhotoManager {
    private static PhotoManager sPhotoManager;

    private List<Photo> mPhotos;

    public static PhotoManager get() {
        if (sPhotoManager == null) {
            sPhotoManager = new PhotoManager();
        }
        return sPhotoManager;
    }

    private PhotoManager() {
        mPhotos = new ArrayList<>();
    }

    public List<Photo> getPhotos() {
        return mPhotos;
    }

    public Photo getPhoto(UUID id) {
        for (Photo photo : mPhotos) {
            if (photo.getId().equals(id)) {
                return photo;
            }
        }

        return null;
    }
}

// end of file
