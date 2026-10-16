package com.shifat.flux;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Random;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

@CapacitorPlugin(name = "FluxSyncplay")
public class FluxSyncplayPlugin extends Plugin {
    private static final String TAG = "FluxSyncplay";
    private static final String DEFAULT_HOST = "syncplay.pl";
    private static final int DEFAULT_PORT = 8995;
    private static final int HEARTBEAT_INTERVAL_MS = 1500;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private Socket tcpSocket;
    private SSLSocket sslSocket;
    private BufferedReader reader;
    private BufferedWriter writer;

    private boolean isConnected = false;
    private String currentCode = "";
    private String currentRoom = "";
    private String currentMemberId = "";
    private boolean isHost = false;

    private Runnable heartbeatRunnable;

    @Override
    public void load() {
        super.load();
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            return "0000000000000000";
        }
    }

    private static String roomNameForCode(String code) {
        String hash = sha256Hex("flux-teleparty-v1:" + code);
        return "FLUX-TP-" + hash.substring(0, 16);
    }

    private static String generateCode() {
        Random rnd = new SecureRandom();
        int num = 10000 + rnd.nextInt(90000);
        return String.valueOf(num);
    }

    private static String generateMemberId() {
        Random rnd = new SecureRandom();
        byte[] bytes = new byte[4];
        rnd.nextBytes(bytes);
        StringBuilder sb = new StringBuilder("FX_");
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    @PluginMethod
    public void hostSession(PluginCall call) {
        String code = call.getString("code", "");
        if (code == null || code.trim().isEmpty()) {
            code = generateCode();
        } else {
            code = code.trim();
        }
        String host = call.getString("host", DEFAULT_HOST);
        int port = call.getInt("port", DEFAULT_PORT);

        final String finalCode = code;
        isHost = true;
        connectInternal(finalCode, host, port, call);
    }

    @PluginMethod
    public void joinSession(PluginCall call) {
        String code = call.getString("code", "");
        if (code == null || code.trim().isEmpty()) {
            call.reject("Room code is required");
            return;
        }
        code = code.trim();
        String host = call.getString("host", DEFAULT_HOST);
        int port = call.getInt("port", DEFAULT_PORT);

        final String finalCode = code;
        isHost = false;
        connectInternal(finalCode, host, port, call);
    }

    private void connectInternal(final String code, final String host, final int port, final PluginCall call) {
        disconnectInternal();

        currentCode = code;
        currentRoom = roomNameForCode(code);
        currentMemberId = generateMemberId();

        executor.execute(() -> {
            try {
                Log.i(TAG, "Connecting to " + host + ":" + port + " for room " + currentRoom);
                tcpSocket = new Socket();
                tcpSocket.connect(new InetSocketAddress(host, port), 10000);
                tcpSocket.setTcpNoDelay(true);
                tcpSocket.setKeepAlive(true);

                BufferedReader plainReader = new BufferedReader(new InputStreamReader(tcpSocket.getInputStream(), StandardCharsets.UTF_8));
                BufferedWriter plainWriter = new BufferedWriter(new OutputStreamWriter(tcpSocket.getOutputStream(), StandardCharsets.UTF_8));

                // 1. Send StartTLS command
                JSONObject tlsObj = new JSONObject();
                JSONObject tlsInner = new JSONObject();
                tlsInner.put("startTLS", "send");
                tlsObj.put("TLS", tlsInner);
                plainWriter.write(tlsObj.toString() + "\r\n");
                plainWriter.flush();

                // 2. Read StartTLS response
                String tlsResp = plainReader.readLine();
                Log.i(TAG, "StartTLS response: " + tlsResp);

                // 3. Upgrade to SSLSocket
                SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
                sslSocket = (SSLSocket) factory.createSocket(tcpSocket, host, port, true);
                sslSocket.startHandshake();

                reader = new BufferedReader(new InputStreamReader(sslSocket.getInputStream(), StandardCharsets.UTF_8));
                writer = new BufferedWriter(new OutputStreamWriter(sslSocket.getOutputStream(), StandardCharsets.UTF_8));
                isConnected = true;

                // 4. Send Hello handshake
                JSONObject helloObj = new JSONObject();
                JSONObject hello = new JSONObject();
                JSONObject room = new JSONObject();
                room.put("name", currentRoom);
                hello.put("room", room);
                hello.put("username", currentMemberId);
                hello.put("version", "1.2.255");
                hello.put("realversion", "1.7.6");

                JSONObject features = new JSONObject();
                features.put("sharedPlaylists", true);
                features.put("chat", true);
                features.put("featureList", true);
                features.put("readiness", true);
                features.put("managedRooms", true);
                features.put("persistentRooms", false);
                features.put("uiMode", "GUI");
                hello.put("features", features);

                helloObj.put("Hello", hello);
                writeJson(helloObj);

                // 5. Send initial FLUX presence
                JSONObject initPresence = new JSONObject();
                initPresence.put("v", 1);
                initPresence.put("t", "hello");
                initPresence.put("f", currentMemberId);
                if (isHost) {
                    initPresence.put("h", 1);
                }
                sendFluxChatInternal(initPresence);

                // Start heartbeat
                startHeartbeat();

                // Resolve call
                JSObject result = new JSObject();
                result.put("code", currentCode);
                result.put("room", currentRoom);
                result.put("memberId", currentMemberId);
                result.put("isHost", isHost);
                call.resolve(result);

                // Notify frontend
                notifyFrontend("joined", result);

                // 6. Listen loop
                listenLoop();

            } catch (Exception e) {
                Log.e(TAG, "Syncplay connection failed", e);
                disconnectInternal();
                call.reject("Connection failed: " + e.getMessage());
                JSObject err = new JSObject();
                err.put("error", e.getMessage());
                notifyFrontend("error", err);
            }
        });
    }

    private void listenLoop() {
        try {
            String line;
            while (isConnected && reader != null && (line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;

                try {
                    JSONObject root = new JSONObject(line);
                    if (root.has("Chat")) {
                        String chat = root.getString("Chat");
                        if (chat.startsWith("FLUX|")) {
                            String fluxJson = chat.substring(5);
                            JSONObject fluxObj = new JSONObject(fluxJson);
                            handleFluxMessage(fluxObj);
                        }
                    } else if (root.has("Set")) {
                        JSONObject setObj = root.getJSONObject("Set");
                        if (setObj.has("user")) {
                            // User presence changes
                            JSObject obj = new JSObject();
                            obj.put("userEvent", setObj.toString());
                            notifyFrontend("presenceUpdate", obj);
                        }
                    }
                } catch (Exception jsonErr) {
                    Log.w(TAG, "Ignored line parse error: " + line);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Reader loop ended", e);
        } finally {
            disconnectInternal();
            JSObject dc = new JSObject();
            dc.put("reason", "closed");
            notifyFrontend("disconnected", dc);
        }
    }

    private void handleFluxMessage(JSONObject fluxObj) {
        try {
            String type = fluxObj.optString("t", "");
            String from = fluxObj.optString("f", "");
            if (from.equals(currentMemberId)) {
                return; // Ignore own echo
            }

            JSObject data = new JSObject();
            data.put("type", type);
            data.put("from", from);
            data.put("isHost", fluxObj.optInt("h", 0) == 1);
            if (fluxObj.has("e")) {
                data.put("event", fluxObj.optString("e"));
            }
            if (fluxObj.has("d")) {
                data.put("data", JSObject.fromJSONObject(fluxObj.getJSONObject("d")));
            }

            notifyFrontend("fluxMessage", data);

            if ("hello".equals(type) || "presence".equals(type)) {
                JSObject mem = new JSObject();
                mem.put("memberId", from);
                notifyFrontend("memberJoined", mem);
            } else if ("bye".equals(type)) {
                JSObject mem = new JSObject();
                mem.put("memberId", from);
                notifyFrontend("memberLeft", mem);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling flux message", e);
        }
    }

    private void startHeartbeat() {
        stopHeartbeat();
        heartbeatRunnable = new Runnable() {
            @Override
            public void run() {
                if (isConnected) {
                    executor.execute(() -> {
                        try {
                            double nowSec = System.currentTimeMillis() / 1000.0;
                            JSONObject ping = new JSONObject();
                            ping.put("clientLatencyCalculation", nowSec);
                            ping.put("clientRtt", 0.0);

                            JSONObject playstate = new JSONObject();
                            playstate.put("position", 0.0);
                            playstate.put("paused", true);
                            playstate.put("doSeek", false);

                            JSONObject state = new JSONObject();
                            state.put("ping", ping);
                            state.put("playstate", playstate);

                            JSONObject root = new JSONObject();
                            root.put("State", state);
                            writeJson(root);

                            // Send periodic presence
                            JSONObject presence = new JSONObject();
                            presence.put("v", 1);
                            presence.put("t", "presence");
                            presence.put("f", currentMemberId);
                            if (isHost) {
                                presence.put("h", 1);
                            }
                            sendFluxChatInternal(presence);
                        } catch (Exception ignored) {
                        }
                    });
                    mainHandler.postDelayed(this, HEARTBEAT_INTERVAL_MS);
                }
            }
        };
        mainHandler.postDelayed(heartbeatRunnable, HEARTBEAT_INTERVAL_MS);
    }

    private void stopHeartbeat() {
        if (heartbeatRunnable != null) {
            mainHandler.removeCallbacks(heartbeatRunnable);
            heartbeatRunnable = null;
        }
    }

    private synchronized void writeJson(JSONObject json) {
        try {
            if (writer != null && isConnected) {
                writer.write(json.toString() + "\r\n");
                writer.flush();
            }
        } catch (Exception e) {
            Log.w(TAG, "writeJson failed", e);
        }
    }

    private void sendFluxChatInternal(JSONObject payload) {
        try {
            JSONObject chatRoot = new JSONObject();
            chatRoot.put("Chat", "FLUX|" + payload.toString());
            writeJson(chatRoot);
        } catch (Exception e) {
            Log.e(TAG, "sendFluxChatInternal failed", e);
        }
    }

    @PluginMethod
    public void sendMessage(PluginCall call) {
        if (!isConnected) {
            call.reject("Not connected to Teleparty session");
            return;
        }
        JSObject payloadJs = call.getObject("payload");
        if (payloadJs == null) {
            call.reject("payload is required");
            return;
        }

        executor.execute(() -> {
            try {
                JSONObject payload = new JSONObject(payloadJs.toString());
                payload.put("v", 1);
                payload.put("f", currentMemberId);
                if (isHost) {
                    payload.put("h", 1);
                }
                sendFluxChatInternal(payload);
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to send message: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void leaveSession(PluginCall call) {
        executor.execute(() -> {
            try {
                if (isConnected && currentMemberId != null && !currentMemberId.isEmpty()) {
                    JSONObject bye = new JSONObject();
                    bye.put("v", 1);
                    bye.put("t", "bye");
                    bye.put("f", currentMemberId);
                    sendFluxChatInternal(bye);
                }
            } catch (Exception ignored) {
            }
            disconnectInternal();
            call.resolve();
        });
    }

    @PluginMethod
    public void getSessionState(PluginCall call) {
        JSObject obj = new JSObject();
        obj.put("connected", isConnected);
        obj.put("code", currentCode);
        obj.put("room", currentRoom);
        obj.put("memberId", currentMemberId);
        obj.put("isHost", isHost);
        call.resolve(obj);
    }

    private synchronized void disconnectInternal() {
        isConnected = false;
        stopHeartbeat();
        try {
            if (writer != null) {
                writer.close();
            }
        } catch (Exception ignored) {}
        try {
            if (reader != null) {
                reader.close();
            }
        } catch (Exception ignored) {}
        try {
            if (sslSocket != null) {
                sslSocket.close();
            }
        } catch (Exception ignored) {}
        try {
            if (tcpSocket != null) {
                tcpSocket.close();
            }
        } catch (Exception ignored) {}
        writer = null;
        reader = null;
        sslSocket = null;
        tcpSocket = null;
    }

    private void notifyFrontend(String eventName, JSObject data) {
        mainHandler.post(() -> notifyListeners(eventName, data));
    }
}
