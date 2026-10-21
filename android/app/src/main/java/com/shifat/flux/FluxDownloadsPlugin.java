package com.shifat.flux;

import android.app.DownloadManager;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import android.webkit.MimeTypeMap;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;

@CapacitorPlugin(name = "FluxDownloads")
public class FluxDownloadsPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        String rawUrl = call.getString("url", "");
        String title = call.getString("title", "FLUX download");
        String location = call.getString("location", "downloads");
        String folderName = call.getString("folderName", "");

        if (rawUrl.isEmpty()) {
            call.reject("Download URL is empty");
            return;
        }

        try {
            String safeTitle = sanitize(title);
            String extension = MimeTypeMap.getFileExtensionFromUrl(rawUrl);
            if (extension == null || extension.isEmpty()) extension = "mkv";
            if (!safeTitle.toLowerCase(Locale.US).endsWith("." + extension.toLowerCase(Locale.US))) {
                safeTitle += "." + extension;
            }

            String safeFolder = sanitize(folderName);
            String relativePath = "FLUX/" + (safeFolder.isEmpty() ? "" : safeFolder + "/") + safeTitle;
            String directory = "movies".equals(location)
                    ? Environment.DIRECTORY_MOVIES
                    : Environment.DIRECTORY_DOWNLOADS;

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(rawUrl));
            request.setTitle(title);
            request.setDescription("FLUX · Downloading");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);
            request.setMimeType(MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension));
            request.setDestinationInExternalPublicDir(directory, relativePath);

            DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            long downloadId = manager.enqueue(request);

            JSObject result = new JSObject();
            result.put("downloadId", downloadId);
            result.put("folderPath", directory + "/" + relativePath);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to start download", error);
        }
    }

    @PluginMethod
    public void status(PluginCall call) {
        long downloadId = call.getLong("downloadId", -1L);
        if (downloadId < 0) {
            call.reject("Invalid download id");
            return;
        }

        DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        try (Cursor cursor = manager.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) {
                call.reject("Download not found");
                return;
            }

            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            long downloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
            long total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
            String localUri = cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI));

            JSObject result = new JSObject();
            result.put("status", mapStatus(status));
            result.put("downloadedBytes", downloaded);
            result.put("totalBytes", total);
            result.put("localUri", localUri == null ? "" : localUri);
            if (status == DownloadManager.STATUS_FAILED) {
                result.put("reason", cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON)));
            }
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to read download status", error);
        }
    }

    private String mapStatus(int status) {
        if (status == DownloadManager.STATUS_SUCCESSFUL) return "completed";
        if (status == DownloadManager.STATUS_FAILED) return "failed";
        if (status == DownloadManager.STATUS_PAUSED) return "paused";
        if (status == DownloadManager.STATUS_PENDING) return "queued";
        return "downloading";
    }

    private String sanitize(String input) {
        return input == null ? "" : input.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }
}
