import android.app.Service;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class GitHubService extends Service {

    private static final String TAG = "GitHubService";
    private static final String GITHUB_API_URL = "https://api.github.com/repos/draikon/your-repo/commits";
    private static final int MAX_ATTEMPTS = 5;
    private static final int BACK_OFF_DELAY = 1000; // 1 secundă

    private ExecutorService executorService;

    @Override
    public void onCreate() {
        super.onCreate();
        executorService = Executors.newSingleThreadExecutor();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service a fost pornit");
        executorService.execute(new GitHubTask());
        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(1, TimeUnit.MINUTES)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    private class GitHubTask extends AsyncTask<Void, Void, String> {

        @Override
        protected String doInBackground(Void... voids) {
            int attempts = 0;
            while (attempts < MAX_ATTEMPTS) {
                try {
                    return getCommitsFromGitHub();
                } catch (IOException e) {
                    Log.e(TAG, "Eroare la cerere GitHub", e);
                    attempts++;
                    SystemClock.sleep(BACK_OFF_DELAY);
                }
            }
            return null;
        }

        @Override
        protected void onPostExecute(String commits) {
            super.onPostExecute(commits);
            if (commits != null) {
                Log.d(TAG, "Commits noi: " + commits);
                // Procesează commits noi
            } else {
                Log.e(TAG, "Nu s-au putut obține commits noi");
            }
        }
    }

    private String getCommitsFromGitHub() throws IOException {
        URL url = new URL(GITHUB_API_URL);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Accept", "application/json");

        int responseCode = connection.getResponseCode();
        if (responseCode == 200) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder builder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
            reader.close();

            String json = builder.toString();
            return extractMessageFromJson(json);
        } else {
            throw new IOException("Cod de răspuns: " + responseCode);
        }
    }

    private String extractMessageFromJson(String json) {
        int startIndex = json.indexOf("{");
        int endIndex = json.indexOf("}");
        if (startIndex != -1 && endIndex != -1) {
            String jsonObject = json.substring(startIndex + 1, endIndex);
            int messageStartIndex = jsonObject.indexOf("\"message\":");
            if (messageStartIndex != -1) {
                int messageEndIndex = jsonObject.indexOf("\"", messageStartIndex + 10);
                if (messageEndIndex != -1) {
                    return jsonObject.substring(messageStartIndex + 10, messageEndIndex);
                }
            }
        }
        return null;
    }
}
