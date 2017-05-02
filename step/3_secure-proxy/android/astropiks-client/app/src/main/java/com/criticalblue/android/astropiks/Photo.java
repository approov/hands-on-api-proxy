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

import java.util.Date;
import java.util.UUID;

/**
 * Holds properties for a picture of the day.
 */
public class Photo {

    private UUID mId;
    private Date mDate;
    private String mTitle;
    private String mDesc;
    private String mUrl;

    public Photo() {
        mId = UUID.randomUUID();
        mDate = null;
        mTitle = null;
        mDesc = null;
        mUrl = null;
    }

    /**
     * Returns the unique identifier associated with this photo.
     *
     * @return the UUID.
     */
    public UUID getId() {
        return mId;
    }

    /**
     * Sets the date for this photo.
     *
     * @param date the date.
     */
    public void setDate(Date date) {
        mDate = date;
    }

    /**
     * Returns the date for this photo.
     *
     * @return the date.
     */
    public Date getDate() {
        return mDate;
    }

    /**
     * Sets the title for this photo.
     *
     * @param title the title.
     */
    public void setTitle(String title) {
        mTitle = title;
    }

    /**
     * Returns the title for this photo.
     *
     * @return the title.
     */
    public String getTitle() {
        return mTitle;
    }

    /**
     * Sets the description for this photo.
     *
     * @param desc the description.
     */
    public void setDesc(String desc) {
        mDesc = desc;
    }

    /**
     * Returns the description for this photo.
     *
     * @return the description.
     */
    public String getDesc() {
        return mDesc;
    }

    /**
     * Sets the image URL for this photo.
     *
     * @param url the image url.
     */
    public void setUrl(String url) {
        mUrl = url;
    }

    /**
     * Returns the image URL for this photo.
     *
     * @return the image URL.
     */
    public String getUrl() {
        return mUrl;
    }
}

// end of file
