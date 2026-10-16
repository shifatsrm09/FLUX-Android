package com.shifat.flux;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.SeekBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONArray;
import org.json.JSONObject;
import org.videolan.libvlc.LibVLC;
import org.videolan.libvlc.Media;
import org.videolan.libvlc.MediaPlayer;
import org.videolan.libvlc.util.VLCVideoLayout;

import java.util.ArrayList;
import java.util.Locale;

public class VlcPlayerActivity extends AppCompatActivity {

    public static final String EXTRA_URL = "extra_url";
    public static final String EXTRA_TITLE = "extra_title";
    public static final String EXTRA_QUALITY = "extra_quality";
    public static final String EXTRA_POSITION_MS = "extra_position_ms";
    public static final String EXTRA_SOURCES_JSON = "extra_sources_json";

    public static final String RESULT_POSITION_MS = "result_position_ms";
    public static final String RESULT_DURATION_MS = "result_duration_ms";
    public static final String RESULT_COMPLETED = "result_completed";

    private LibVLC mLibVLC;
    private MediaPlayer mMediaPlayer;
    private VLCVideoLayout mVideoLayout;

    private RelativeLayout mLayoutControls;
    private View mTouchOverlay;
    private LinearLayout mLayoutBuffering;
    private TextView mTvBufferingText;
    private FrameLayout mLayoutOsd;
    private TextView mTvOsd;
    private ImageButton mBtnUnlockScreen;

    private ImageButton mBtnBack;
    private TextView mTvTitle;
    private TextView mTvQuality;
    private LinearLayout mLayoutSources;

    private TextView mTvCurrentTime;
    private SeekBar mPlayerSeekbar;
    private TextView mTvTotalTime;

    private ImageButton mBtnReplay10;
    private ImageButton mBtnPlayPause;
    private ImageButton mBtnForward10;
    private Button mBtnSpeed;
    private Button mBtnAspect;
    private ImageButton mBtnLock;

    private final Handler mHandler = new Handler(Looper.getMainLooper());
    private Runnable mHideControlsRunnable;
    private Runnable mHideOsdRunnable;

    private boolean mIsControlsVisible = true;
    private boolean mIsLocked = false;
    private boolean mIsUserSeeking = false;
    private boolean mIsCompleted = false;

    private String mCurrentUrl;
    private String mTitle;
    private String mQuality;
    private long mInitialPositionMs = 0;
    private long mLastPositionMs = 0;
    private long mDurationMs = 0;

    private final float[] SPEED_PRESETS = new float[]{1.0f, 1.25f, 1.5f, 2.0f, 0.5f, 0.75f};
    private int mCurrentSpeedIndex = 0;

    private final String[] ASPECT_PRESETS = new String[]{"Fit", "16:9", "4:3", "Fill"};
    private int mCurrentAspectIndex = 0;

    private AudioManager mAudioManager;
    private int mMaxStreamVolume;
    private float mCurrentBrightness = -1f;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_vlc_player);

        hideSystemUI();

        mAudioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (mAudioManager != null) {
            mMaxStreamVolume = mAudioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        }

        extractIntentExtras();
        initViews();
        setupLibVLC();
        setupListeners();
        setupGestureDetector();

        startPlayback(mCurrentUrl, mInitialPositionMs);
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    private void extractIntentExtras() {
        Intent intent = getIntent();
        if (intent != null) {
            mCurrentUrl = intent.getStringExtra(EXTRA_URL);
            mTitle = intent.getStringExtra(EXTRA_TITLE);
            mQuality = intent.getStringExtra(EXTRA_QUALITY);
            mInitialPositionMs = intent.getLongExtra(EXTRA_POSITION_MS, 0);
        }
        if (mTitle == null || mTitle.isEmpty()) {
            mTitle = "FLUX Player";
        }
        if (mQuality == null || mQuality.isEmpty()) {
            mQuality = "HD";
        }
    }

    private void initViews() {
        mVideoLayout = findViewById(R.id.vlc_video_layout);
        mTouchOverlay = findViewById(R.id.touch_overlay);
        mLayoutControls = findViewById(R.id.layout_controls);
        mLayoutBuffering = findViewById(R.id.layout_buffering);
        mTvBufferingText = findViewById(R.id.tv_buffering_text);
        mLayoutOsd = findViewById(R.id.layout_osd);
        mTvOsd = findViewById(R.id.tv_osd);
        mBtnUnlockScreen = findViewById(R.id.btn_unlock_screen);

        mBtnBack = findViewById(R.id.btn_back);
        mTvTitle = findViewById(R.id.tv_player_title);
        mTvQuality = findViewById(R.id.tv_player_quality);
        mLayoutSources = findViewById(R.id.layout_sources);

        mTvCurrentTime = findViewById(R.id.tv_current_time);
        mPlayerSeekbar = findViewById(R.id.player_seekbar);
        mTvTotalTime = findViewById(R.id.tv_total_time);

        mBtnReplay10 = findViewById(R.id.btn_replay_10);
        mBtnPlayPause = findViewById(R.id.btn_play_pause);
        mBtnForward10 = findViewById(R.id.btn_forward_10);
        mBtnSpeed = findViewById(R.id.btn_speed);
        mBtnAspect = findViewById(R.id.btn_aspect);
        mBtnLock = findViewById(R.id.btn_lock);

        mTvTitle.setText(mTitle);
        mTvQuality.setText(mQuality);

        setupSourcesPills();
    }

    private void setupSourcesPills() {
        mLayoutSources.removeAllViews();
        String sourcesJson = getIntent().getStringExtra(EXTRA_SOURCES_JSON);
        if (sourcesJson == null || sourcesJson.isEmpty()) return;

        try {
            JSONArray arr = new JSONArray(sourcesJson);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                final String name = obj.optString("name", "Source " + (i + 1));
                final String url = obj.optString("url", "");

                if (url.isEmpty()) continue;

                Button pill = new Button(this);
                pill.setText(name);
                pill.setTextSize(11f);
                pill.setAllCaps(false);
                pill.setPadding(32, 12, 32, 12);
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        dpToPx(32)
                );
                lp.setMarginEnd(dpToPx(8));
                pill.setLayoutParams(lp);

                boolean isActive = url.equals(mCurrentUrl);
                pill.setBackgroundResource(isActive ? R.drawable.bg_source_pill_active : R.drawable.bg_source_pill_inactive);
                pill.setTextColor(0xFFFFFFFF);

                pill.setOnClickListener(v -> {
                    if (!url.equals(mCurrentUrl)) {
                        long currentPos = mMediaPlayer != null ? mMediaPlayer.getTime() : 0;
                        mCurrentUrl = url;
                        setupSourcesPills();
                        startPlayback(mCurrentUrl, currentPos);
                        showOsd("Switched to " + name);
                    }
                });

                mLayoutSources.addView(pill);
            }
        } catch (Exception ignored) {
        }
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density + 0.5f);
    }

    private void setupLibVLC() {
        ArrayList<String> options = new ArrayList<>();
        options.add("--no-drop-late-frames");
        options.add("--no-skip-frames");
        options.add("--network-caching=2500");
        options.add("--file-caching=2000");
        options.add("--live-caching=2000");
        options.add("--rtsp-tcp");
        options.add("--audio-time-stretch");

        mLibVLC = new LibVLC(this, options);
        mMediaPlayer = new MediaPlayer(mLibVLC);
        mMediaPlayer.attachViews(mVideoLayout, null, true, false);

        mMediaPlayer.setEventListener(event -> {
            switch (event.type) {
                case MediaPlayer.Event.Buffering:
                    float percent = event.getBuffering();
                    if (percent < 100f) {
                        mLayoutBuffering.setVisibility(View.VISIBLE);
                        mTvBufferingText.setText(String.format(Locale.US, "Buffering stream... %d%%", (int) percent));
                    } else {
                        mLayoutBuffering.setVisibility(View.GONE);
                    }
                    break;

                case MediaPlayer.Event.Playing:
                    mLayoutBuffering.setVisibility(View.GONE);
                    mBtnPlayPause.setImageResource(R.drawable.ic_player_pause);
                    scheduleHideControls();
                    break;

                case MediaPlayer.Event.Paused:
                    mBtnPlayPause.setImageResource(R.drawable.ic_player_play);
                    showControls();
                    break;

                case MediaPlayer.Event.TimeChanged:
                    long timeMs = event.getTimeChanged();
                    mLastPositionMs = timeMs;
                    if (!mIsUserSeeking) {
                        updateProgressUI(timeMs, mDurationMs);
                    }
                    break;

                case MediaPlayer.Event.LengthChanged:
                    mDurationMs = event.getLengthChanged();
                    if (!mIsUserSeeking) {
                        updateProgressUI(mLastPositionMs, mDurationMs);
                    }
                    break;

                case MediaPlayer.Event.EndReached:
                    mIsCompleted = true;
                    mBtnPlayPause.setImageResource(R.drawable.ic_player_play);
                    showControls();
                    break;

                case MediaPlayer.Event.EncounteredError:
                    mLayoutBuffering.setVisibility(View.GONE);
                    showOsd("Playback Error. Please try an alternative mirror.");
                    break;
            }
        });
    }

    private void startPlayback(String url, long seekPositionMs) {
        if (url == null || url.isEmpty() || mMediaPlayer == null) return;

        mLayoutBuffering.setVisibility(View.VISIBLE);
        mTvBufferingText.setText("Connecting to BDIX stream...");

        try {
            Uri uri = Uri.parse(url);
            Media media = new Media(mLibVLC, uri);
            media.setHWDecoderEnabled(true, false);
            mMediaPlayer.setMedia(media);
            media.release();

            mMediaPlayer.play();

            if (seekPositionMs > 1000) {
                mHandler.postDelayed(() -> {
                    if (mMediaPlayer != null && mMediaPlayer.isPlaying()) {
                        mMediaPlayer.setTime(seekPositionMs);
                        showOsd("Resumed at " + formatTime(seekPositionMs));
                    }
                }, 800);
            }
        } catch (Exception e) {
            showOsd("Error opening media: " + e.getMessage());
        }
    }

    private void setupListeners() {
        mBtnBack.setOnClickListener(v -> finishWithResult());

        mBtnPlayPause.setOnClickListener(v -> {
            if (mMediaPlayer == null) return;
            if (mMediaPlayer.isPlaying()) {
                mMediaPlayer.pause();
                showOsd("Paused");
            } else {
                mMediaPlayer.play();
                showOsd("Play");
            }
            scheduleHideControls();
        });

        mBtnReplay10.setOnClickListener(v -> seekRelative(-10000));
        mBtnForward10.setOnClickListener(v -> seekRelative(10000));

        mBtnSpeed.setOnClickListener(v -> {
            mCurrentSpeedIndex = (mCurrentSpeedIndex + 1) % SPEED_PRESETS.length;
            float speed = SPEED_PRESETS[mCurrentSpeedIndex];
            if (mMediaPlayer != null) {
                mMediaPlayer.setRate(speed);
            }
            mBtnSpeed.setText(String.format(Locale.US, "%.2gx", speed));
            showOsd("Speed: " + String.format(Locale.US, "%.2gx", speed));
            scheduleHideControls();
        });

        mBtnAspect.setOnClickListener(v -> {
            mCurrentAspectIndex = (mCurrentAspectIndex + 1) % ASPECT_PRESETS.length;
            String mode = ASPECT_PRESETS[mCurrentAspectIndex];
            mBtnAspect.setText(mode);
            applyAspectRatio(mode);
            showOsd("Aspect Ratio: " + mode);
            scheduleHideControls();
        });

        mBtnLock.setOnClickListener(v -> toggleLock(true));
        mBtnUnlockScreen.setOnClickListener(v -> toggleLock(false));

        mPlayerSeekbar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (fromUser && mDurationMs > 0) {
                    long targetTime = (long) ((progress / 1000f) * mDurationMs);
                    mTvCurrentTime.setText(formatTime(targetTime));
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
                mIsUserSeeking = true;
                cancelHideControls();
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                if (mDurationMs > 0 && mMediaPlayer != null) {
                    long targetTime = (long) ((seekBar.getProgress() / 1000f) * mDurationMs);
                    mMediaPlayer.setTime(targetTime);
                    mLastPositionMs = targetTime;
                }
                mIsUserSeeking = false;
                scheduleHideControls();
            }
        });
    }

    private void seekRelative(long deltaMs) {
        if (mMediaPlayer == null) return;
        long currentTime = mMediaPlayer.getTime();
        long newTime = Math.max(0, Math.min(mDurationMs > 0 ? mDurationMs : Long.MAX_VALUE, currentTime + deltaMs));
        mMediaPlayer.setTime(newTime);
        mLastPositionMs = newTime;
        showOsd((deltaMs > 0 ? "+10s (" : "-10s (") + formatTime(newTime) + ")");
        scheduleHideControls();
    }

    private void applyAspectRatio(String mode) {
        if (mMediaPlayer == null) return;
        switch (mode) {
            case "16:9":
                mMediaPlayer.setAspectRatio("16:9");
                mMediaPlayer.setScale(0f);
                break;
            case "4:3":
                mMediaPlayer.setAspectRatio("4:3");
                mMediaPlayer.setScale(0f);
                break;
            case "Fill":
                mMediaPlayer.setAspectRatio(null);
                mMediaPlayer.setScale(1.35f);
                break;
            case "Fit":
            default:
                mMediaPlayer.setAspectRatio(null);
                mMediaPlayer.setScale(0f);
                break;
        }
    }

    private void toggleLock(boolean locked) {
        mIsLocked = locked;
        if (mIsLocked) {
            mLayoutControls.setVisibility(View.GONE);
            mBtnUnlockScreen.setVisibility(View.VISIBLE);
            showOsd("Screen Locked");
            mHandler.postDelayed(() -> mBtnUnlockScreen.setVisibility(View.GONE), 3000);
        } else {
            mBtnUnlockScreen.setVisibility(View.GONE);
            mLayoutControls.setVisibility(View.VISIBLE);
            showOsd("Screen Unlocked");
            scheduleHideControls();
        }
    }

    private void setupGestureDetector() {
        GestureDetector gestureDetector = new GestureDetector(this, new GestureDetector.SimpleOnGestureListener() {
            @Override
            public boolean onSingleTapConfirmed(MotionEvent e) {
                if (mIsLocked) {
                    mBtnUnlockScreen.setVisibility(
                            mBtnUnlockScreen.getVisibility() == View.VISIBLE ? View.GONE : View.VISIBLE
                    );
                    return true;
                }
                toggleControls();
                return true;
            }

            @Override
            public boolean onDoubleTap(MotionEvent e) {
                if (mIsLocked) return true;
                int screenWidth = getResources().getDisplayMetrics().widthPixels;
                if (e.getX() < screenWidth / 2f) {
                    seekRelative(-10000);
                } else {
                    seekRelative(10000);
                }
                return true;
            }

            @Override
            public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
                if (mIsLocked || e1 == null || e2 == null) return false;

                int screenWidth = getResources().getDisplayMetrics().widthPixels;
                int screenHeight = getResources().getDisplayMetrics().heightPixels;

                // Vertical swipe on right half: Volume
                if (e1.getX() > screenWidth * 0.55f && Math.abs(distanceY) > Math.abs(distanceX)) {
                    adjustVolume(distanceY / screenHeight);
                    return true;
                }

                // Vertical swipe on left half: Brightness
                if (e1.getX() < screenWidth * 0.45f && Math.abs(distanceY) > Math.abs(distanceX)) {
                    adjustBrightness(distanceY / screenHeight);
                    return true;
                }

                return false;
            }
        });

        mTouchOverlay.setOnTouchListener((v, event) -> {
            gestureDetector.onTouchEvent(event);
            return true;
        });
    }

    private void adjustVolume(float delta) {
        if (mAudioManager == null) return;
        int currentVol = mAudioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
        int change = (int) (delta * mMaxStreamVolume * 1.5f);
        if (change == 0) {
            change = delta > 0 ? 1 : -1;
        }
        int newVol = Math.max(0, Math.min(mMaxStreamVolume, currentVol + change));
        mAudioManager.setStreamVolume(AudioManager.STREAM_MUSIC, newVol, 0);

        int percent = (int) ((newVol / (float) mMaxStreamVolume) * 100);
        showOsd("Volume: " + percent + "%");
    }

    private void adjustBrightness(float delta) {
        WindowManager.LayoutParams lp = getWindow().getAttributes();
        if (mCurrentBrightness < 0) {
            mCurrentBrightness = lp.screenBrightness;
            if (mCurrentBrightness < 0) mCurrentBrightness = 0.5f;
        }
        mCurrentBrightness = Math.max(0.05f, Math.min(1.0f, mCurrentBrightness + (delta * 0.8f)));
        lp.screenBrightness = mCurrentBrightness;
        getWindow().setAttributes(lp);

        int percent = (int) (mCurrentBrightness * 100);
        showOsd("Brightness: " + percent + "%");
    }

    private void updateProgressUI(long currentMs, long totalMs) {
        mTvCurrentTime.setText(formatTime(currentMs));
        if (totalMs > 0) {
            mTvTotalTime.setText(formatTime(totalMs));
            int progress = (int) (((float) currentMs / totalMs) * 1000);
            mPlayerSeekbar.setProgress(progress);
        }
    }

    private String formatTime(long ms) {
        long totalSeconds = ms / 1000;
        long seconds = totalSeconds % 60;
        long minutes = (totalSeconds / 60) % 60;
        long hours = totalSeconds / 3600;

        if (hours > 0) {
            return String.format(Locale.US, "%02d:%02d:%02d", hours, minutes, seconds);
        } else {
            return String.format(Locale.US, "%02d:%02d", minutes, seconds);
        }
    }

    private void toggleControls() {
        if (mIsControlsVisible) {
            hideControls();
        } else {
            showControls();
        }
    }

    private void showControls() {
        mIsControlsVisible = true;
        mLayoutControls.setVisibility(View.VISIBLE);
        hideSystemUI();
        scheduleHideControls();
    }

    private void hideControls() {
        mIsControlsVisible = false;
        mLayoutControls.setVisibility(View.GONE);
        hideSystemUI();
        cancelHideControls();
    }

    private void scheduleHideControls() {
        cancelHideControls();
        mHideControlsRunnable = () -> {
            if (mMediaPlayer != null && mMediaPlayer.isPlaying() && !mIsUserSeeking) {
                hideControls();
            }
        };
        mHandler.postDelayed(mHideControlsRunnable, 3500);
    }

    private void cancelHideControls() {
        if (mHideControlsRunnable != null) {
            mHandler.removeCallbacks(mHideControlsRunnable);
        }
    }

    private void showOsd(String text) {
        mTvOsd.setText(text);
        mLayoutOsd.setVisibility(View.VISIBLE);
        if (mHideOsdRunnable != null) {
            mHandler.removeCallbacks(mHideOsdRunnable);
        }
        mHideOsdRunnable = () -> mLayoutOsd.setVisibility(View.GONE);
        mHandler.postDelayed(mHideOsdRunnable, 1500);
    }

    private void finishWithResult() {
        Intent resultIntent = new Intent();
        resultIntent.putExtra(RESULT_POSITION_MS, mLastPositionMs);
        resultIntent.putExtra(RESULT_DURATION_MS, mDurationMs);
        resultIntent.putExtra(RESULT_COMPLETED, mIsCompleted);
        setResult(Activity.RESULT_OK, resultIntent);
        finish();
    }

    @Override
    public void onBackPressed() {
        if (mIsLocked) {
            showOsd("Screen is locked. Tap unlock button to exit.");
            return;
        }
        finishWithResult();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mMediaPlayer != null && mMediaPlayer.isPlaying()) {
            mMediaPlayer.pause();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        cancelHideControls();
        if (mMediaPlayer != null) {
            mMediaPlayer.stop();
            mMediaPlayer.detachViews();
            mMediaPlayer.release();
            mMediaPlayer = null;
        }
        if (mLibVLC != null) {
            mLibVLC.release();
            mLibVLC = null;
        }
    }
}
