package com.example.vpn

import android.app.Application
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.example.vpn.worker.ConfigUpdateWorker
import dagger.hilt.android.HiltAndroidApp
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@HiltAndroidApp
class VpnApplication : Application(), Configuration.Provider {

    companion object {
        private const val TAG = "VpnApplication"
    }

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() {
            return try {
                val builder = Configuration.Builder()
                    .setMinimumLoggingLevel(Log.INFO)
                if (::workerFactory.isInitialized) {
                    builder.setWorkerFactory(workerFactory)
                }
                builder.build()
            } catch (e: Throwable) {
                Log.e(TAG, "Error building WorkManager configuration", e)
                Configuration.Builder().build()
            }
        }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Application created successfully on Android ${Build.VERSION.SDK_INT}")
        
        // اجرا بدون بلاک کردن ترد اصلی جهت جلوگیری از هنگ و کراش استارت‌آپ
        Handler(Looper.getMainLooper()).postDelayed({
            try {
                scheduleConfigUpdates()
            } catch (e: Throwable) {
                Log.e(TAG, "Safe catch during delayed background worker scheduling", e)
            }
        }, 3000)
    }

    private fun scheduleConfigUpdates() {
        try {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<ConfigUpdateWorker>(24, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "config_update_work",
                ExistingPeriodicWorkPolicy.UPDATE,
                request
            )
            Log.i(TAG, "ConfigUpdateWorker scheduled successfully")
        } catch (e: Throwable) {
            Log.e(TAG, "WorkManager initialization or scheduling skipped safely", e)
        }
    }
}
