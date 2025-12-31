import { query } from '../config/database.js';
import { sendDowntimeAlert, sendRecoveryNotification } from './emailService.js';
import { sendWebhook } from './webhookService.js';

/**
 * Auto-create incident when API goes down
 */
export async function detectAndCreateIncident(api) {
  try {
    // Check if there's already an open incident for this API
    const existingIncident = await query(
      `SELECT id FROM incidents
       WHERE api_id = $1
       AND status != 'resolved'
       ORDER BY started_at DESC
       LIMIT 1`,
      [api.id]
    );

    // If there's already an open incident, don't create a new one
    if (existingIncident.rows.length > 0) {
      console.log(`   ⚠️  Incident already exists for ${api.name}`);
      return;
    }

    // Create new incident
    const incident = await query(
      `INSERT INTO incidents (api_id, title, description, status, started_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        api.id,
        `${api.name} is down`,
        `Automated incident: ${api.name} (${api.url}) is not responding as expected.`,
        'ongoing',
      ]
    );

    console.log(`   📋 Created incident #${incident.rows[0].id} for ${api.name}`);

    // Send email notification if enabled
    await sendDowntimeAlert(api, incident.rows[0]);

    // Send webhook notification for API down
    await sendWebhook('api_down', api, incident.rows[0]);

    return incident.rows[0];
  } catch (error) {
    console.error('Error creating incident:', error);
  }
}

/**
 * Auto-resolve incident when API comes back up
 */
export async function autoResolveIncident(api) {
  try {
    // Find the most recent open incident for this API
    const openIncident = await query(
      `SELECT * FROM incidents
       WHERE api_id = $1
       AND status != 'resolved'
       ORDER BY started_at DESC
       LIMIT 1`,
      [api.id]
    );

    if (openIncident.rows.length === 0) {
      // No open incident to resolve
      return;
    }

    const incident = openIncident.rows[0];

    // Calculate downtime duration for logging
    const startedAt = new Date(incident.started_at);
    const resolvedAt = new Date();
    const durationMinutes = Math.round((resolvedAt - startedAt) / 1000 / 60);

    // Resolve the incident
    await query(
      `UPDATE incidents
       SET status = 'resolved',
           resolved_at = CURRENT_TIMESTAMP,
           description = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [
        `${incident.description} Resolved automatically.`,
        incident.id,
      ]
    );

    console.log(`   ✅ Resolved incident #${incident.id} for ${api.name} (${durationMinutes}m downtime)`);

    // Fetch the updated incident with resolved_at timestamp
    const updatedIncident = await query(
      `SELECT * FROM incidents WHERE id = $1`,
      [incident.id]
    );

    // Send email recovery notification if enabled
    await sendRecoveryNotification(api, updatedIncident.rows[0], durationMinutes);

    // Send webhook notification for API up
    await sendWebhook('api_up', api, updatedIncident.rows[0]);

    return incident;
  } catch (error) {
    console.error('Error resolving incident:', error);
  }
}

/**
 * Get current active incidents
 */
export async function getActiveIncidents() {
  try {
    const result = await query(
      `SELECT i.*, a.name as api_name, a.url as api_url
       FROM incidents i
       JOIN apis a ON i.api_id = a.id
       WHERE i.status != 'resolved'
       ORDER BY i.started_at DESC`
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching active incidents:', error);
    return [];
  }
}

/**
 * Get incident statistics
 */
export async function getIncidentStats(apiId = null, days = 30) {
  try {
    let queryText = `
      SELECT
        COUNT(*) as total_incidents,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_incidents,
        AVG(
          EXTRACT(EPOCH FROM (resolved_at - started_at)) / 60
        ) as avg_downtime_minutes
      FROM incidents
      WHERE started_at >= CURRENT_DATE - INTERVAL '${days} days'
    `;

    const values = [];
    if (apiId) {
      queryText += ' AND api_id = $1';
      values.push(apiId);
    }

    const result = await query(queryText, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching incident stats:', error);
    return null;
  }
}

export default {
  detectAndCreateIncident,
  autoResolveIncident,
  getActiveIncidents,
  getIncidentStats,
};
