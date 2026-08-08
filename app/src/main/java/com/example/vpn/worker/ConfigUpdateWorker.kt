package com.example.vpn.worker

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class ConfigUpdateWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            Log.i("ConfigUpdateWorker", "Starting background config update...")
            Result.success()
        } catch (e: Exception) {
            Log.e("ConfigUpdateWorker", "Error updating configs in background", e)
            Result.retry()
        }
    }
}
