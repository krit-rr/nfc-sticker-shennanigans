package com.kritika.tap.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/** Fired by AlarmManager at each ring time; hands off to the foreground ringing service. */
class AlarmRingReceiver : BroadcastReceiver() {
  companion object {
    const val ACTION_RING = "com.kritika.tap.alarm.RING"
    const val EXTRA_ID = "ringId"
    const val EXTRA_LABEL = "label"
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ACTION_RING) return
    val service =
      Intent(context, AlarmRingService::class.java)
        .putExtra(EXTRA_ID, intent.getStringExtra(EXTRA_ID))
        .putExtra(EXTRA_LABEL, intent.getStringExtra(EXTRA_LABEL))
    if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service)
    else context.startService(service)
  }
}
