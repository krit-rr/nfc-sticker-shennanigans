package com.kritika.tap.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android half of apps/mobile/src/lib/alarm-scheduler.ts (see docs/alarm-strategy.md).
 *
 * Each ring of a nag chain is one exact alarm set with AlarmManager.setAlarmClock(), the same
 * one-alarm-per-ring design as AlarmKit on iOS: dismissing a ring never touches the ones still
 * scheduled, and only cancelRing() — driven by the dismiss-sticker tap — removes them.
 * When a ring fires, AlarmRingReceiver starts AlarmRingService, which plays a looping alarm
 * sound and posts a full-screen notification whose Stop button stops that ring only.
 */
class TapAlarmModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val alarmManager: AlarmManager
    get() = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  override fun definition() = ModuleDefinition {
    Name("TapAlarm")

    /** False when the user has revoked the exact-alarm permission (possible on API 31-32). */
    Function("canScheduleExact") {
      if (Build.VERSION.SDK_INT >= 31) alarmManager.canScheduleExactAlarms() else true
    }

    /** Full-screen alerts need POST_NOTIFICATIONS on API 33+; a no-op before that. */
    AsyncFunction("requestNotificationPermission") { promise: Promise ->
      if (Build.VERSION.SDK_INT >= 33) {
        Permissions.askForPermissionsWithPermissionsManager(
          appContext.permissions,
          promise,
          android.Manifest.permission.POST_NOTIFICATIONS,
        )
      } else {
        promise.resolve(null)
      }
    }

    Function("scheduleRing") { id: String, atMillis: Double, label: String ->
      val triggerAt = atMillis.toLong()
      val ring = ringIntent(id).putExtra(AlarmRingReceiver.EXTRA_LABEL, label)
      val pending =
        PendingIntent.getBroadcast(
          context,
          0,
          ring,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
      val canExact = Build.VERSION.SDK_INT < 31 || alarmManager.canScheduleExactAlarms()
      if (canExact) {
        // setAlarmClock: rings in Doze, shows the status-bar alarm icon, counts as a clock alarm.
        alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAt, launchPending()), pending)
      } else {
        // Degraded but never silent: inexact delivery when the user revoked exact alarms.
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
      }
    }

    Function("cancelRing") { id: String ->
      val pending =
        PendingIntent.getBroadcast(
          context,
          0,
          ringIntent(id),
          PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
        )
      if (pending != null) {
        alarmManager.cancel(pending)
        pending.cancel()
      }
      AlarmRingService.stopIfRinging(context, id)
    }
  }

  /** The data Uri makes each ring id its own PendingIntent (Intent.filterEquals). */
  private fun ringIntent(id: String): Intent =
    Intent(context, AlarmRingReceiver::class.java)
      .setAction(AlarmRingReceiver.ACTION_RING)
      .setData(Uri.parse("tap-alarm://ring/$id"))
      .putExtra(AlarmRingReceiver.EXTRA_ID, id)

  /** What the status-bar alarm icon opens; null is allowed when the app has no launch intent. */
  private fun launchPending(): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    return PendingIntent.getActivity(
      context,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }
}
