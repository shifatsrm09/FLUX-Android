package com.shifat.flux;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.hardware.SensorManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.GestureDetector;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.SeekBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SwitchCompat;

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
    private View mPausedDimmer;
    private FrameLayout mBtnCenterPlay;
    private LinearLayout mLayoutBuffering;
    private TextView mTvBufferingText;
    private FrameLayout mLayoutOsd;
    private TextView mTvOsd;

    private ImageButton mBtnBack;
    private TextView mTvTitle;
    private TextView mTvQuality;
    private ImageButton mBtnOrientationToggle;
    private OrientationEventListener mOrientationListener;
    private boolean mIsLandscape = false;

    private TextView mTvCurrentTime;
    private SeekBar mPlayerSeekbar;
    private TextView mTvTotalTime;

    private ImageButton mBtnPlayPause;
    private ImageButton mBtnReplay10;
    private ImageButton mBtnForward10;
    private ImageButton mBtnNextEpisode;
    private ImageButton mBtnVolumeMute;
    private SeekBar mVolumeSeekbar;
    private ImageButton mBtnEpisodes;
    private ImageButton mBtnTracks;
    private Button mBtnAspect;
    private ImageButton mBtnFullscreen;

    // Audio & Subtitles Popup
    private LinearLayout mPopupTracks;
    private LinearLayout mListAudioTracks;
    private LinearLayout mListSubtitleTracks;
    private SwitchCompat mSwitchAutoplay;

    private final Handler mHandler = new Handler(Looper.getMainLooper());
    private Runnable mHideControlsRunnable;
    private Runnable mHideOsdRunnable;

    private boolean mIsControlsVisible = true;
    private boolean mIsUserSeeking = false;
    private boolean mIsCompleted = false;
    private boolean mIsMuted = false;
    private int mLastUnmutedVolume = 100;
    private boolean mIsFullscreen = true;
    private float mTouchDownX;
    private float mTouchDownY;

    private String mCurrentUrl;
    private String mTitle;
    private String mQuality;
    private long mInitialPositionMs = 0;
    private long mLastPositionMs = 0;
    private long mDurationMs = 0;

    private final String[] ASPECT_PRESETS = new String[]{"Fit", "16:9", "4:3", "Fill"};
    private int mCurrentAspectIndex = 0;

    private AudioManager mAudioManager;
    private SharedPreferences mPrefs;

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
        mPrefs = getSharedPreferences("flux_player_prefs", MODE_PRIVATE);

        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        mIsLandscape = false;
        setupOrientationListener();

        extractIntentExtras();
        initViews();
        setupLibVLC();
        setupListeners();
        setupGestureDetector();
        applyResponsivePlayerLayout();

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
            mQuality = "1080p";
        }
    }

    private void initViews() {
        mVideoLayout = findViewById(R.id.vlc_video_layout);
        mTouchOverlay = findViewById(R.id.touch_overlay);
        mPausedDimmer = findViewById(R.id.paused_dimmer);
        mBtnCenterPlay = findViewById(R.id.btn_center_play);
        mLayoutControls = findViewById(R.id.layout_controls);
        mLayoutBuffering = findViewById(R.id.layout_buffering);
        mTvBufferingText = findViewById(R.id.tv_buffering_text);
        mLayoutOsd = findViewById(R.id.layout_osd);
        mTvOsd = findViewById(R.id.tv_osd);

        mBtnBack = findViewById(R.id.btn_back);
        mTvTitle = findViewById(R.id.tv_player_title);
        mTvQuality = findViewById(R.id.tv_player_quality);
        mBtnOrientationToggle = findViewById(R.id.btn_orientation_toggle);

        mTvCurrentTime = findViewById(R.id.tv_current_time);
        mPlayerSeekbar = findViewById(R.id.player_seekbar);
        mTvTotalTime = findViewById(R.id.tv_total_time);

        mBtnPlayPause = findViewById(R.id.btn_play_pause);
        mBtnReplay10 = findViewById(R.id.btn_replay_10);
        mBtnForward10 = findViewById(R.id.btn_forward_10);
        mBtnNextEpisode = findViewById(R.id.btn_next_episode);
        mBtnVolumeMute = findViewById(R.id.btn_volume_mute);
        mVolumeSeekbar = findViewById(R.id.volume_seekbar);
        mBtnEpisodes = findViewById(R.id.btn_episodes);
        mBtnTracks = findViewById(R.id.btn_tracks);
        mBtnAspect = findViewById(R.id.btn_aspect);
        mBtnFullscreen = findViewById(R.id.btn_fullscreen);

        mPopupTracks = findViewById(R.id.popup_tracks);
        mListAudioTracks = findViewById(R.id.list_audio_tracks);
        mListSubtitleTracks = findViewById(R.id.list_subtitle_tracks);
        mSwitchAutoplay = findViewById(R.id.switch_autoplay);

        mTvTitle.setText(mTitle);
        mTvQuality.setText(mQuality);

        boolean autoplay = mPrefs.getBoolean("autoplay_next", true);
        mSwitchAutoplay.setChecked(autoplay);
        mSwitchAutoplay.setOnCheckedChangeListener((btn, isChecked) -> {
            mPrefs.edit().putBoolean("autoplay_next", isChecked).apply();
            showOsd(isChecked ? "Autoplay Next Enabled" : "Autoplay Next Disabled");
        });
    }

    private long mLastManualToggleTime = 0;

    private void toggleOrientation() {
        mLastManualToggleTime = System.currentTimeMillis();
        if (mIsLandscape) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            mIsLandscape = false;
            if (mBtnFullscreen != null) {
                mBtnFullscreen.setImageResource(R.drawable.ic_player_fullscreen);
            }
            showOsd("Portrait Mode");
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
            mIsLandscape = true;
            if (mBtnFullscreen != null) {
                mBtnFullscreen.setImageResource(R.drawable.ic_player_fullscreen_exit);
            }
            showOsd("Landscape Mode");
        }
    }

    private void setupOrientationListener() {
        mOrientationListener = new OrientationEventListener(this, SensorManager.SENSOR_DELAY_NORMAL) {
            @Override
            public void onOrientationChanged(int orientation) {
                if (orientation == ORIENTATION_UNKNOWN) return;
                // Ignore sensor updates for 4 seconds after manual button tap
                if (System.currentTimeMillis() - mLastManualToggleTime < 4000) return;

                // Switch to landscape when phone physically turned sideways
                if ((orientation >= 65 && orientation <= 115) || (orientation >= 245 && orientation <= 295)) {
                    if (!mIsLandscape) {
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                        mIsLandscape = true;
                        if (mBtnFullscreen != null) {
                            mBtnFullscreen.setImageResource(R.drawable.ic_player_fullscreen_exit);
                        }
                    }
                } else if ((orientation >= 335 || orientation <= 25) || (orientation >= 155 && orientation <= 205)) {
                    if (mIsLandscape) {
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                        mIsLandscape = false;
                        if (mBtnFullscreen != null) {
                            mBtnFullscreen.setImageResource(R.drawable.ic_player_fullscreen);
                        }
                    }
                }
            }
        };
        if (mOrientationListener.canDetectOrientation()) {
            mOrientationListener.enable();
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
                        mTvBufferingText.setText(String.format(Locale.US, "Buffering %d%%", (int) percent));
                    } else {
                        mLayoutBuffering.setVisibility(View.GONE);
                    }
                    break;

                case MediaPlayer.Event.Playing:
                    mLayoutBuffering.setVisibility(View.GONE);
                    mPausedDimmer.setVisibility(View.GONE);
                    mBtnCenterPlay.setVisibility(View.GONE);
                    mBtnPlayPause.setImageResource(R.drawable.ic_player_pause);
                    scheduleHideControls();
                    break;

                case MediaPlayer.Event.Paused:
                    mPausedDimmer.setVisibility(View.VISIBLE);
                    mBtnCenterPlay.setVisibility(View.VISIBLE);
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
                    mPausedDimmer.setVisibility(View.VISIBLE);
                    mBtnCenterPlay.setVisibility(View.VISIBLE);
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
        mTvBufferingText.setText("Connecting to stream...");

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
        if (mBtnOrientationToggle != null) {
            mBtnOrientationToggle.setOnClickListener(v -> toggleOrientation());
        }

        View.OnClickListener togglePlayListener = v -> {
            if (mMediaPlayer == null) return;
            if (mMediaPlayer.isPlaying()) {
                mMediaPlayer.pause();
                showOsd("Paused");
            } else {
                mMediaPlayer.play();
                showOsd("Play");
            }
            scheduleHideControls();
        };

        mBtnPlayPause.setOnClickListener(togglePlayListener);
        mBtnCenterPlay.setOnClickListener(togglePlayListener);

        mBtnReplay10.setOnClickListener(v -> seekRelative(-10000));
        mBtnForward10.setOnClickListener(v -> seekRelative(10000));

        mBtnNextEpisode.setOnClickListener(v -> {
            showOsd("Next Episode");
            scheduleHideControls();
        });

        mBtnVolumeMute.setOnClickListener(v -> toggleMute());

        mVolumeSeekbar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (fromUser && mMediaPlayer != null) {
                    mMediaPlayer.setVolume(progress);
                    mIsMuted = (progress == 0);
                    mBtnVolumeMute.setImageResource(mIsMuted ? R.drawable.ic_player_volume_mute : R.drawable.ic_player_volume_high);
                    showOsd("Volume " + progress + "%");
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
                cancelHideControls();
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                scheduleHideControls();
            }
        });

        mBtnTracks.setOnClickListener(v -> toggleTracksPopup());

        mBtnEpisodes.setOnClickListener(v -> {
            showOsd("Episodes list");
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

        mBtnFullscreen.setOnClickListener(v -> toggleFullscreen());

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

    private void toggleMute() {
        if (mMediaPlayer == null) return;
        mIsMuted = !mIsMuted;
        if (mIsMuted) {
            mLastUnmutedVolume = mMediaPlayer.getVolume();
            mMediaPlayer.setVolume(0);
            mVolumeSeekbar.setProgress(0);
            mBtnVolumeMute.setImageResource(R.drawable.ic_player_volume_mute);
            showOsd("Muted");
        } else {
            int vol = mLastUnmutedVolume > 0 ? mLastUnmutedVolume : 100;
            mMediaPlayer.setVolume(vol);
            mVolumeSeekbar.setProgress(vol);
            mBtnVolumeMute.setImageResource(R.drawable.ic_player_volume_high);
            showOsd("Volume " + vol + "%");
        }
    }

    private void toggleFullscreen() {
        toggleOrientation();
        hideSystemUI();
    }

    private void toggleTracksPopup() {
        if (mPopupTracks.getVisibility() == View.VISIBLE) {
            mPopupTracks.setVisibility(View.GONE);
            scheduleHideControls();
        } else {
            applyResponsivePlayerLayout();
            populateTracksMenu();
            mPopupTracks.setVisibility(View.VISIBLE);
            cancelHideControls();
        }
    }

    /** Keep controls usable on narrow portrait screens and wide landscape screens. */
    private void applyResponsivePlayerLayout() {
        if (mPopupTracks == null) return;

        boolean portrait = getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT;
        int screenWidth = getResources().getDisplayMetrics().widthPixels;
        int margin = dpToPx(portrait ? 12 : 24);

        FrameLayout.LayoutParams popupParams = (FrameLayout.LayoutParams) mPopupTracks.getLayoutParams();
        popupParams.width = portrait ? screenWidth - (margin * 2) : Math.min(dpToPx(460), screenWidth - (margin * 2));
        popupParams.gravity = Gravity.BOTTOM | Gravity.END;
        popupParams.setMargins(margin, 0, margin, dpToPx(portrait ? 92 : 110));
        mPopupTracks.setLayoutParams(popupParams);

        View columnsView = mPopupTracks.getChildAt(0);
        if (columnsView instanceof LinearLayout) {
            LinearLayout columns = (LinearLayout) columnsView;
            View audioColumn = columns.getChildAt(0);
            View divider = columns.getChildAt(1);
            View subtitleColumn = columns.getChildAt(2);

            if (portrait) {
                columns.setOrientation(LinearLayout.VERTICAL);
                columns.getLayoutParams().height = dpToPx(252);
                divider.setVisibility(View.GONE);
                for (View column : new View[]{audioColumn, subtitleColumn}) {
                    LinearLayout.LayoutParams lp = (LinearLayout.LayoutParams) column.getLayoutParams();
                    lp.width = LinearLayout.LayoutParams.MATCH_PARENT;
                    lp.height = dpToPx(116);
                    lp.weight = 0;
                    column.setLayoutParams(lp);
                }
            } else {
                columns.setOrientation(LinearLayout.HORIZONTAL);
                columns.getLayoutParams().height = dpToPx(220);
                divider.setVisibility(View.VISIBLE);
                LinearLayout.LayoutParams audioLp = (LinearLayout.LayoutParams) audioColumn.getLayoutParams();
                audioLp.width = 0;
                audioLp.height = LinearLayout.LayoutParams.MATCH_PARENT;
                audioLp.weight = 1;
                audioColumn.setLayoutParams(audioLp);
                LinearLayout.LayoutParams subtitleLp = (LinearLayout.LayoutParams) subtitleColumn.getLayoutParams();
                subtitleLp.width = 0;
                subtitleLp.height = LinearLayout.LayoutParams.MATCH_PARENT;
                subtitleLp.weight = 1;
                subtitleColumn.setLayoutParams(subtitleLp);
            }
        }

        LinearLayout bottomBar = findViewById(R.id.bottom_bar);
        if (bottomBar != null) {
            int side = dpToPx(portrait ? 12 : 28);
            bottomBar.setPadding(side, dpToPx(8), side, dpToPx(portrait ? 12 : 20));
        }

        // Keep the most useful controls visible in portrait; secondary controls remain available in landscape.
        if (mVolumeSeekbar != null) mVolumeSeekbar.setVisibility(portrait ? View.GONE : View.VISIBLE);
        if (mBtnNextEpisode != null) mBtnNextEpisode.setVisibility(portrait ? View.GONE : View.VISIBLE);
        if (mBtnEpisodes != null) mBtnEpisodes.setVisibility(portrait ? View.GONE : View.VISIBLE);
        if (mBtnAspect != null) mBtnAspect.setVisibility(portrait ? View.GONE : View.VISIBLE);
    }

    private void populateTracksMenu() {
        mListAudioTracks.removeAllViews();
        mListSubtitleTracks.removeAllViews();

        if (mMediaPlayer == null) return;

        // Populate Audio Tracks
        MediaPlayer.TrackDescription[] audioTracks = mMediaPlayer.getAudioTracks();
        int currentAudioId = mMediaPlayer.getAudioTrack();

        if (audioTracks != null && audioTracks.length > 0) {
            for (MediaPlayer.TrackDescription track : audioTracks) {
                final int id = track.id;
                final String name = track.name;
                final boolean isSelected = (id == currentAudioId);

                View itemView = createTrackRow(name, isSelected, () -> {
                    mMediaPlayer.setAudioTrack(id);
                    populateTracksMenu();
                    showOsd("Audio: " + name);
                });
                mListAudioTracks.addView(itemView);
            }
        } else {
            TextView emptyText = new TextView(this);
            emptyText.setText("No audio tracks");
            emptyText.setTextColor(0x80949BA4);
            emptyText.setTextSize(12f);
            mListAudioTracks.addView(emptyText);
        }

        // Populate Subtitle (SPU) Tracks
        MediaPlayer.TrackDescription[] spuTracks = mMediaPlayer.getSpuTracks();
        int currentSpuId = mMediaPlayer.getSpuTrack();

        if (spuTracks != null && spuTracks.length > 0) {
            for (MediaPlayer.TrackDescription track : spuTracks) {
                final int id = track.id;
                final String name = track.name;
                final boolean isSelected = (id == currentSpuId);

                View itemView = createTrackRow(name, isSelected, () -> {
                    mMediaPlayer.setSpuTrack(id);
                    populateTracksMenu();
                    showOsd("Subtitles: " + name);
                });
                mListSubtitleTracks.addView(itemView);
            }
        } else {
            TextView emptyText = new TextView(this);
            emptyText.setText("No subtitles available");
            emptyText.setTextColor(0x80949BA4);
            emptyText.setTextSize(12f);
            mListSubtitleTracks.addView(emptyText);
        }
    }

    private View createTrackRow(String label, boolean isSelected, Runnable onClick) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dpToPx(8), dpToPx(8), dpToPx(8), dpToPx(8));
        row.setClickable(true);
        row.setFocusable(true);
        row.setBackgroundResource(R.drawable.bg_round_button);

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dpToPx(38)
        );
        lp.bottomMargin = dpToPx(2);
        row.setLayoutParams(lp);

        // Checkmark indicator
        ImageView check = new ImageView(this);
        check.setLayoutParams(new LinearLayout.LayoutParams(dpToPx(16), dpToPx(16)));
        if (isSelected) {
            check.setImageResource(R.drawable.ic_check);
        } else {
            check.setVisibility(View.INVISIBLE);
        }
        row.addView(check);

        // Track label
        TextView text = new TextView(this);
        LinearLayout.LayoutParams textLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        textLp.setMarginStart(dpToPx(10));
        text.setLayoutParams(textLp);
        text.setText(label);
        text.setTextColor(isSelected ? Color.WHITE : 0xCCDBDEE1);
        text.setTextSize(13f);
        text.setTypeface(null, isSelected ? Typeface.BOLD : Typeface.NORMAL);
        row.addView(text);

        row.setOnClickListener(v -> onClick.run());
        return row;
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

    private void setupGestureDetector() {
        GestureDetector gestureDetector = new GestureDetector(this, new GestureDetector.SimpleOnGestureListener() {
            @Override
            public boolean onSingleTapConfirmed(MotionEvent e) {
                if (mPopupTracks.getVisibility() == View.VISIBLE) {
                    mPopupTracks.setVisibility(View.GONE);
                    return true;
                }
                toggleControls();
                return true;
            }

            @Override
            public boolean onDoubleTap(MotionEvent e) {
                int screenWidth = getResources().getDisplayMetrics().widthPixels;
                if (e.getX() < screenWidth / 2f) {
                    seekRelative(-10000);
                } else {
                    seekRelative(10000);
                }
                return true;
            }

            @Override
            public boolean onFling(MotionEvent start, MotionEvent end, float velocityX, float velocityY) {
                float distanceY = end.getY() - start.getY();
                if (Math.abs(distanceY) < dpToPx(48) || Math.abs(distanceY) < Math.abs(end.getX() - start.getX())) {
                    return false;
                }

                float width = getResources().getDisplayMetrics().widthPixels;
                boolean rightSide = start.getX() >= width * 0.55f;
                boolean leftSide = start.getX() <= width * 0.45f;
                boolean increase = distanceY < 0;

                if (rightSide) {
                    adjustGestureVolume(increase ? 1 : -1);
                    return true;
                }
                if (leftSide) {
                    adjustGestureBrightness(increase ? 1 : -1);
                    return true;
                }
                return false;
            }
        });

        mTouchOverlay.setOnTouchListener((v, event) -> {
            if (event.getAction() == MotionEvent.ACTION_DOWN) {
                mTouchDownX = event.getX();
                mTouchDownY = event.getY();
            }
            gestureDetector.onTouchEvent(event);
            return true;
        });
    }

    private void adjustGestureVolume(int direction) {
        if (mMediaPlayer == null) return;
        int current = mMediaPlayer.getVolume();
        int next = Math.max(0, Math.min(200, current + (direction * 20)));
        mMediaPlayer.setVolume(next);
        mVolumeSeekbar.setProgress(next);
        mIsMuted = next == 0;
        mBtnVolumeMute.setImageResource(mIsMuted ? R.drawable.ic_player_volume_mute : R.drawable.ic_player_volume_high);
        showOsd((direction > 0 ? "Volume up · " : "Volume down · ") + next + "%");
    }

    private void adjustGestureBrightness(int direction) {
        WindowManager.LayoutParams params = getWindow().getAttributes();
        float current = params.screenBrightness;
        if (current < 0f) current = 0.5f;
        float next = Math.max(0.05f, Math.min(1f, current + (direction * 0.08f)));
        params.screenBrightness = next;
        getWindow().setAttributes(params);
        showOsd((direction > 0 ? "Brightness up · " : "Brightness down · ") + Math.round(next * 100) + "%");
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
        mPopupTracks.setVisibility(View.GONE);
        hideSystemUI();
        cancelHideControls();
    }

    private void scheduleHideControls() {
        cancelHideControls();
        mHideControlsRunnable = () -> {
            if (mMediaPlayer != null && mMediaPlayer.isPlaying() && !mIsUserSeeking && mPopupTracks.getVisibility() != View.VISIBLE) {
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
        if (mPopupTracks.getVisibility() == View.VISIBLE) {
            mPopupTracks.setVisibility(View.GONE);
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
        if (mOrientationListener != null) {
            mOrientationListener.disable();
            mOrientationListener = null;
        }
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
