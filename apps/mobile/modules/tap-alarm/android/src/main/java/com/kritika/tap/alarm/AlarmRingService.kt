package com.kritika.tap.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper

/**
 * Plays one ring of the chain: looping default alarm sound + a full-screen notification.
 * The Stop action stops THIS ring only; the next ring is already scheduled with AlarmManager,
 * which is what makes "must tap the sticker" enforceable. Each ring also times itself out
 * after RING_FOR_MS, mirroring AlarmKit's ~9-minute postAlert on iOS.
 */
class AlarmRingService : Service() {
  companion object {
    private const val CHANNEL_ID = "tap-alarm-rings"
    private const val NOTIFICATION_ID = 0x7a9 // one ring at a time; a new ring replaces the last
    private const val ACTION_STOP = "com.kritika.tap.alarm.STOP_RING"
    private const val RING_FOR_MS = 9L * 60L * 1000L

    @Volatile private var currentRingId: String? = null

    /** Called by TapAlarmModule.cancelRing when the dismiss sticker is tapped. */
    fun stopIfRinging(context: Context, id: String) {
      if (currentRingId == id) context.stopService(Intent(context, AlarmRingService::class.java))
    }
  }

  private var player: MediaPlayer? = null
  private val handler = Handler(Looper.getMainLooper())
  private val timeout = Runnable { stopSelf() }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }

    val id = intent?.getStringExtra(AlarmRingReceiver.EXTRA_ID) ?: return START_NOT_STICKY
    val label = intent.getStringExtra(AlarmRingReceiver.EXTRA_LABEL) ?: "Alarm"
    currentRingId = id

    val notification = buildNotification(label)
    if (Build.VERSION.SDK_INT >= 29) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }

    startSound()
    handler.removeCallbacks(timeout)
    handler.postDelayed(timeout, RING_FOR_MS)
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(timeout)
    player?.stop()
    player?.release()
    player = null
    currentRingId = null
    super.onDestroy()
  }

  /** Looping default alarm tone on the alarm stream, so it respects alarm volume, not media. */
  private fun startSound() {
    player?.release()
    val uri =
      RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
        ?: return
    player =
      MediaPlayer().apply {
        setDataSource(this@AlarmRingService, uri)
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
        )
        isLooping = true
        prepare()
        start()
      }
  }

  private fun buildNotification(label: String): Notification {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) {
      // Sound comes from our looping player, so the channel itself is silent.
      val channel =
        NotificationChannel(CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_HIGH).apply {
          setSound(null, null)
          enableVibration(true)
        }
      manager.createNotificationChannel(channel)
    }

    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val fullScreen =
      launch?.let {
        PendingIntent.getActivity(
          this,
          0,
          it,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
      }
    val stop =
      PendingIntent.getService(
        this,
        1,
        Intent(this, AlarmRingService::class.java).setAction(ACTION_STOP),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    val builder =
      (if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL_ID)
       else @Suppress("DEPRECATION") Notification.Builder(this))
        .setSmallIcon(applicationInfo.icon)
        .setContentTitle(label)
        .setContentText("Tap the sticker to stop it for good. Stop silences this ring only.")
        .setCategory(Notification.CATEGORY_ALARM)
        .setOngoing(true)
        .addAction(
          @Suppress("DEPRECATION") Notification.Action.Builder(0, "Stop this ring", stop).build(),
        )
    if (fullScreen != null) {
      builder.setContentIntent(fullScreen)
      builder.setFullScreenIntent(fullScreen, true)
    }
    return builder.build()
  }
}
