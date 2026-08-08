package com.example.vpn

import android.app.Application
import android.os.Build
import android.util.Log
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.example.vpn.worker.ConfigUpdateWorker
import com.example.vpn.worker.ServerUpdateWorker
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
            val builder = Configuration.Builder()
                .setMinimumLoggingLevel(Log.INFO)
            if (::workerFactory.isInitialized) {
                builder.setWorkerFactory(workerFactory)
            }
            return builder.build()
        }

    override fun getWorkManagerConfiguration(): Configuration = workManagerConfiguration

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Application started on Android ${Build.VERSION.SDK_INT}")
        
        try {
            scheduleServerUpdates()
            scheduleConfigUpdates()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule background workers", e)
        }
    }

    private fun scheduleServerUpdates() {
        try {
            val request = PeriodicWorkRequestBuilder<ServerUpdateWorker>(
                6, TimeUnit.HOURS
            ).apply {
                setConstraints(
                    androidx.work.Constraints.Builder()
                        .setRequiredNetworkType(
                            androidx.work.NetworkType.CONNECTED
                        )
                        .build()
                )
            }.build()

            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "server_update_work",
                ExistingPeriodicWorkPolicy.UPDATE,
                request
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule server update worker", e)
        }
    }

    private fun scheduleConfigUpdates() {
        try {
            val request = PeriodicWorkRequestBuilder<ConfigUpdateWorker>(
                24, TimeUnit.HOURS
            ).apply {
                setConstraints(
                    androidx.work.Constraints.Builder()
                        .setRequiredNetworkType(
                            androidx.work.NetworkType.CONNECTED
                        )
                        .build()
                )
            }.build()

            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "config_update_work",
                ExistingPeriodicWorkPolicy.UPDATE,
                request
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule config update worker", e)
        }
    }
}
