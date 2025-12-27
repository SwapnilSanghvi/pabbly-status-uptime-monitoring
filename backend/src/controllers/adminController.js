import { query, getClient } from '../config/database.js';
import { testWebhook } from '../services/webhookService.js';

// ============================================
// API MANAGEMENT
// ============================================

// Get all monitored APIs
export const getAllAPIs = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        a.*,
        (
          SELECT status
          FROM ping_logs
          WHERE api_id = a.id
          ORDER BY pinged_at DESC
          LIMIT 1
        ) as last_status,
        (
          SELECT pinged_at
          FROM ping_logs
          WHERE api_id = a.id
          ORDER BY pinged_at DESC
          LIMIT 1
        ) as last_checked
      FROM apis a
      ORDER BY a.display_order ASC, a.id ASC
    `);

    // Mark as 'pending' if no pings exist yet
    result.rows.forEach(api => {
      if (!api.last_status) {
        api.last_status = 'pending';
      }
    });

    res.json({
      success: true,
      count: result.rows.length,
      apis: result.rows,
    });
  } catch (error) {
    console.error('Get all APIs error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch APIs',
    });
  }
};

// Get single API details
export const getAPIById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM apis WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API not found',
      });
    }

    res.json({
      success: true,
      api: result.rows[0],
    });
  } catch (error) {
    console.error('Get API by ID error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch API details',
    });
  }
};

// Create new API to monitor
export const createAPI = async (req, res) => {
  try {
    const {
      name,
      url,
      monitoring_interval = 60,
      expected_status_code = 200,
      timeout_duration = 30000,
      is_active = true,
      is_public = true,
    } = req.body;

    // Validation
    if (!name || !url) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name and URL are required',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid URL format',
      });
    }

    const result = await query(
      `INSERT INTO apis (name, url, monitoring_interval, expected_status_code, timeout_duration, is_active, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, url, monitoring_interval, expected_status_code, timeout_duration, is_active, is_public]
    );

    res.status(201).json({
      success: true,
      message: 'API added successfully',
      api: result.rows[0],
    });
  } catch (error) {
    console.error('Create API error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create API',
    });
  }
};

// Update API configuration
export const updateAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      url,
      monitoring_interval,
      expected_status_code,
      timeout_duration,
      is_active,
      is_public,
    } = req.body;

    // Check if API exists
    const checkResult = await query('SELECT id FROM apis WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API not found',
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (url !== undefined) {
      // Validate URL
      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid URL format',
        });
      }
      updates.push(`url = $${paramCount}`);
      values.push(url);
      paramCount++;
    }

    if (monitoring_interval !== undefined) {
      updates.push(`monitoring_interval = $${paramCount}`);
      values.push(monitoring_interval);
      paramCount++;
    }

    if (expected_status_code !== undefined) {
      updates.push(`expected_status_code = $${paramCount}`);
      values.push(expected_status_code);
      paramCount++;
    }

    if (timeout_duration !== undefined) {
      updates.push(`timeout_duration = $${paramCount}`);
      values.push(timeout_duration);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (is_public !== undefined) {
      updates.push(`is_public = $${paramCount}`);
      values.push(is_public);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE apis
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    res.json({
      success: true,
      message: 'API updated successfully',
      api: result.rows[0],
    });
  } catch (error) {
    console.error('Update API error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update API',
    });
  }
};

// Delete API
export const deleteAPI = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM apis WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API not found',
      });
    }

    res.json({
      success: true,
      message: 'API deleted successfully',
      api: result.rows[0],
    });
  } catch (error) {
    console.error('Delete API error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete API',
    });
  }
};

// ============================================
// DASHBOARD STATS
// ============================================

export const getDashboardStats = async (req, res) => {
  try {
    // Total APIs
    const totalAPIs = await query('SELECT COUNT(*) as count FROM apis');

    // Active APIs
    const activeAPIs = await query('SELECT COUNT(*) as count FROM apis WHERE is_active = true');

    // Currently down APIs (last ping was failure)
    const downAPIs = await query(`
      SELECT COUNT(DISTINCT api_id) as count
      FROM ping_logs p1
      WHERE status IN ('failure', 'timeout')
      AND pinged_at = (
        SELECT MAX(pinged_at)
        FROM ping_logs p2
        WHERE p2.api_id = p1.api_id
      )
    `);

    // Total pings today
    const pingsToday = await query(`
      SELECT COUNT(*) as count
      FROM ping_logs
      WHERE DATE(pinged_at) = CURRENT_DATE
    `);

    // Average uptime (last 24h)
    const avgUptime = await query(`
      SELECT AVG(uptime_percentage) as avg_uptime
      FROM uptime_summaries
      WHERE period = '24h'
    `);

    // Recent incidents
    const recentIncidents = await query(`
      SELECT COUNT(*) as count
      FROM incidents
      WHERE status != 'resolved'
    `);

    // System settings (for logo and branding)
    const settings = await query('SELECT * FROM system_settings WHERE id = 1');

    res.json({
      success: true,
      stats: {
        total_apis: parseInt(totalAPIs.rows[0].count),
        active_apis: parseInt(activeAPIs.rows[0].count),
        apis_down: parseInt(downAPIs.rows[0].count),
        total_pings_today: parseInt(pingsToday.rows[0].count),
        avg_uptime: parseFloat(avgUptime.rows[0].avg_uptime || 0).toFixed(2),
        open_incidents: parseInt(recentIncidents.rows[0].count),
      },
      settings: settings.rows[0] || {},
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

// ============================================
// LOGS & ANALYTICS
// ============================================

export const getPingLogs = async (req, res) => {
  try {
    const { apiId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = await query(
      `SELECT * FROM ping_logs
       WHERE api_id = $1
       ORDER BY pinged_at DESC
       LIMIT $2 OFFSET $3`,
      [apiId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM ping_logs WHERE api_id = $1',
      [apiId]
    );

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].total),
      logs: result.rows,
    });
  } catch (error) {
    console.error('Get ping logs error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch ping logs',
    });
  }
};

export const getAPIAnalytics = async (req, res) => {
  try {
    const { apiId } = req.params;

    // Get uptime summaries
    const uptimeSummaries = await query(
      `SELECT * FROM uptime_summaries
       WHERE api_id = $1
       ORDER BY period`,
      [apiId]
    );

    // Get recent ping statistics
    const recentStats = await query(
      `SELECT
        COUNT(*) as total_pings,
        COUNT(*) FILTER (WHERE status = 'success') as successful_pings,
        COUNT(*) FILTER (WHERE status = 'failure') as failed_pings,
        AVG(response_time) as avg_response_time,
        MIN(response_time) as min_response_time,
        MAX(response_time) as max_response_time
       FROM ping_logs
       WHERE api_id = $1
       AND pinged_at >= NOW() - INTERVAL '24 hours'`,
      [apiId]
    );

    // Get hourly response times (last 24 hours)
    const hourlyData = await query(
      `SELECT
        DATE_TRUNC('hour', pinged_at) as hour,
        AVG(response_time) as avg_response_time,
        COUNT(*) as ping_count,
        COUNT(*) FILTER (WHERE status = 'success') as success_count
       FROM ping_logs
       WHERE api_id = $1
       AND pinged_at >= NOW() - INTERVAL '24 hours'
       GROUP BY hour
       ORDER BY hour`,
      [apiId]
    );

    res.json({
      success: true,
      analytics: {
        uptime_summaries: uptimeSummaries.rows,
        recent_stats: recentStats.rows[0],
        hourly_data: hourlyData.rows,
      },
    });
  } catch (error) {
    console.error('Get API analytics error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch analytics',
    });
  }
};

// ============================================
// INCIDENTS
// ============================================

export const getIncidents = async (req, res) => {
  try {
    const { status } = req.query;

    let queryText = `
      SELECT i.*, a.name as api_name
      FROM incidents i
      JOIN apis a ON i.api_id = a.id
    `;

    const values = [];
    if (status) {
      queryText += ' WHERE i.status = $1';
      values.push(status);
    }

    queryText += ' ORDER BY i.started_at DESC';

    const result = await query(queryText, values);

    res.json({
      success: true,
      count: result.rows.length,
      incidents: result.rows,
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch incidents',
    });
  }
};

export const createIncident = async (req, res) => {
  try {
    const { api_id, title, description, status = 'ongoing' } = req.body;

    if (!api_id || !title) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'API ID and title are required',
      });
    }

    const result = await query(
      `INSERT INTO incidents (api_id, title, description, status, started_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [api_id, title, description, status]
    );

    res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      incident: result.rows[0],
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create incident',
    });
  }
};

export const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;

      // If status is 'resolved', set resolved_at timestamp
      if (status === 'resolved') {
        updates.push(`resolved_at = CURRENT_TIMESTAMP`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE incidents
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Incident not found',
      });
    }

    res.json({
      success: true,
      message: 'Incident updated successfully',
      incident: result.rows[0],
    });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update incident',
    });
  }
};

export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM incidents WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Incident not found',
      });
    }

    res.json({
      success: true,
      message: 'Incident deleted successfully',
      incident: result.rows[0],
    });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete incident',
    });
  }
};

// ============================================
// SETTINGS
// ============================================

export const getSettings = async (req, res) => {
  try {
    const result = await query('SELECT * FROM system_settings WHERE id = 1');

    res.json({
      success: true,
      settings: result.rows[0] || {},
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch settings',
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      page_title,
      logo_url,
      brand_color,
      custom_message,
      notification_email,
      notifications_enabled,
      data_retention_days,
      webhook_url,
      webhook_enabled,
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (page_title !== undefined) {
      updates.push(`page_title = $${paramCount}`);
      values.push(page_title);
      paramCount++;
    }

    if (logo_url !== undefined) {
      updates.push(`logo_url = $${paramCount}`);
      values.push(logo_url);
      paramCount++;
    }

    if (brand_color !== undefined) {
      updates.push(`brand_color = $${paramCount}`);
      values.push(brand_color);
      paramCount++;
    }

    if (custom_message !== undefined) {
      updates.push(`custom_message = $${paramCount}`);
      values.push(custom_message);
      paramCount++;
    }

    if (notification_email !== undefined) {
      updates.push(`notification_email = $${paramCount}`);
      values.push(notification_email);
      paramCount++;
    }

    if (notifications_enabled !== undefined) {
      updates.push(`notifications_enabled = $${paramCount}`);
      values.push(notifications_enabled);
      paramCount++;
    }

    if (data_retention_days !== undefined) {
      updates.push(`data_retention_days = $${paramCount}`);
      values.push(data_retention_days);
      paramCount++;
    }

    if (webhook_url !== undefined) {
      updates.push(`webhook_url = $${paramCount}`);
      values.push(webhook_url);
      paramCount++;
    }

    if (webhook_enabled !== undefined) {
      updates.push(`webhook_enabled = $${paramCount}`);
      values.push(webhook_enabled);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE system_settings
      SET ${updates.join(', ')}
      WHERE id = 1
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update settings',
    });
  }
};

// ============================================
// LOGO UPLOAD
// ============================================

export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a logo file to upload',
      });
    }

    // Construct the URL path for the uploaded file
    const logoUrl = `/uploads/${req.file.filename}`;

    // Update the logo_url in system_settings
    const result = await query(
      `UPDATE system_settings
       SET logo_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [logoUrl]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Settings not found',
        message: 'System settings record not found',
      });
    }

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo_url: logoUrl,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to upload logo',
    });
  }
};

// ============================================
// WEBHOOKS
// ============================================

export const getWebhookLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0, apiId } = req.query;

    let queryText = 'SELECT * FROM webhook_logs';
    const values = [];
    let paramCount = 1;

    if (apiId) {
      queryText += ` WHERE api_id = $${paramCount}`;
      values.push(apiId);
      paramCount++;
    }

    queryText += ' ORDER BY created_at DESC';
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await query(queryText, values);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM webhook_logs';
    const countValues = [];
    if (apiId) {
      countQuery += ' WHERE api_id = $1';
      countValues.push(apiId);
    }
    const countResult = await query(countQuery, countValues);

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].total),
      logs: result.rows,
    });
  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch webhook logs',
    });
  }
};

export const testWebhookEndpoint = async (req, res) => {
  try {
    const result = await testWebhook();

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
      });
    }
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to test webhook',
    });
  }
};

// ============================================
// API REORDERING
// ============================================

export const reorderAPIs = async (req, res) => {
  try {
    const { apiIds } = req.body; // Array of API IDs in the desired order

    if (!Array.isArray(apiIds) || apiIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'apiIds must be a non-empty array',
      });
    }

    // Update display_order for each API
    const updatePromises = apiIds.map((apiId, index) => {
      return query(
        'UPDATE apis SET display_order = $1 WHERE id = $2',
        [index + 1, apiId]
      );
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'API order updated successfully',
    });
  } catch (error) {
    console.error('Reorder APIs error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update API order',
    });
  }
};
