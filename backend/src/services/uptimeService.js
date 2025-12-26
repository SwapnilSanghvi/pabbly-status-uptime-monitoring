import cron from 'node-cron';
import { query } from '../config/database.js';

/**
 * Calculate uptime percentage for a specific period
 */
async function calculateUptimeForPeriod(apiId, period) {
  let interval;

  switch (period) {
    case '24h':
      interval = '24 hours';
      break;
    case '7d':
      interval = '7 days';
      break;
    case '30d':
      interval = '30 days';
      break;
    case '90d':
      interval = '90 days';
      break;
    default:
      interval = '24 hours';
  }

  try {
    const result = await query(
      `SELECT
        COUNT(*) as total_pings,
        COUNT(*) FILTER (WHERE status = 'success') as successful_pings,
        COUNT(*) FILTER (WHERE status IN ('failure', 'timeout')) as failed_pings,
        AVG(response_time) FILTER (WHERE status = 'success') as avg_response_time,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND((COUNT(*) FILTER (WHERE status = 'success')::numeric / COUNT(*)::numeric) * 100, 2)
        END as uptime_percentage
      FROM ping_logs
      WHERE api_id = $1
      AND pinged_at >= NOW() - INTERVAL '${interval}'`,
      [apiId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const stats = result.rows[0];

    return {
      api_id: apiId,
      period,
      uptime_percentage: parseFloat(stats.uptime_percentage) || 0,
      total_pings: parseInt(stats.total_pings) || 0,
      successful_pings: parseInt(stats.successful_pings) || 0,
      failed_pings: parseInt(stats.failed_pings) || 0,
      avg_response_time: Math.round(parseFloat(stats.avg_response_time) || 0),
    };
  } catch (error) {
    console.error(`Error calculating uptime for API ${apiId}, period ${period}:`, error);
    return null;
  }
}

/**
 * Update uptime summaries for a single API
 */
async function updateUptimeSummaryForAPI(apiId) {
  const periods = ['24h', '7d', '30d', '90d'];

  for (const period of periods) {
    try {
      const stats = await calculateUptimeForPeriod(apiId, period);

      if (!stats) {
        continue;
      }

      // Upsert into uptime_summaries table
      await query(
        `INSERT INTO uptime_summaries
         (api_id, period, uptime_percentage, total_pings, successful_pings, failed_pings, avg_response_time, calculated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (api_id, period)
         DO UPDATE SET
           uptime_percentage = EXCLUDED.uptime_percentage,
           total_pings = EXCLUDED.total_pings,
           successful_pings = EXCLUDED.successful_pings,
           failed_pings = EXCLUDED.failed_pings,
           avg_response_time = EXCLUDED.avg_response_time,
           calculated_at = CURRENT_TIMESTAMP`,
        [
          stats.api_id,
          stats.period,
          stats.uptime_percentage,
          stats.total_pings,
          stats.successful_pings,
          stats.failed_pings,
          stats.avg_response_time,
        ]
      );
    } catch (error) {
      console.error(`Error updating uptime summary for API ${apiId}, period ${period}:`, error);
    }
  }
}

/**
 * Calculate and update uptime summaries for all active APIs
 */
async function calculateAllUptimeSummaries() {
  try {
    console.log(`\n📊 [${new Date().toISOString()}] Calculating uptime summaries...`);

    // Get all active APIs
    const result = await query('SELECT id, name FROM apis WHERE is_active = true');
    const activeAPIs = result.rows;

    if (activeAPIs.length === 0) {
      console.log('   No active APIs to calculate uptime for');
      return;
    }

    console.log(`   Updating uptime for ${activeAPIs.length} API(s)...`);

    // Update summaries for each API
    for (const api of activeAPIs) {
      await updateUptimeSummaryForAPI(api.id);
      console.log(`   ✅ Updated uptime summaries for ${api.name}`);
    }

    console.log('   Uptime calculation completed!\n');
  } catch (error) {
    console.error('❌ Error calculating uptime summaries:', error);
  }
}

/**
 * Clean up old ping logs based on retention policy
 */
async function cleanupOldPingLogs() {
  try {
    const retentionDays = process.env.LOG_RETENTION_DAYS || 90;

    console.log(`\n🧹 [${new Date().toISOString()}] Cleaning up ping logs older than ${retentionDays} days...`);

    const result = await query(
      `DELETE FROM ping_logs
       WHERE pinged_at < CURRENT_DATE - INTERVAL '${retentionDays} days'
       RETURNING id`
    );

    const deletedCount = result.rowCount;

    if (deletedCount > 0) {
      console.log(`   🗑️  Deleted ${deletedCount} old ping log(s)`);
    } else {
      console.log(`   ✅ No old ping logs to clean up`);
    }

    console.log('   Cleanup completed!\n');
  } catch (error) {
    console.error('❌ Error cleaning up ping logs:', error);
  }
}

/**
 * Start uptime calculation scheduler
 */
export function startUptimeCalculations() {
  console.log('📊 Starting uptime calculation service...');

  // Calculate uptime summaries every hour
  cron.schedule('0 * * * *', () => {
    calculateAllUptimeSummaries();
  });

  // Clean up old ping logs once per day at midnight
  cron.schedule('0 0 * * *', () => {
    cleanupOldPingLogs();
  });

  // Run once on startup
  calculateAllUptimeSummaries();

  console.log('✅ Uptime calculation service started!\n');
}

/**
 * Manually trigger uptime calculations (useful for testing)
 */
export async function triggerManualUptimeCalculation() {
  console.log('🔧 Manual uptime calculation triggered...');
  await calculateAllUptimeSummaries();
}

export default {
  calculateUptimeForPeriod,
  calculateAllUptimeSummaries,
  cleanupOldPingLogs,
  startUptimeCalculations,
  triggerManualUptimeCalculation,
};
