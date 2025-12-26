import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import { generateAccessToken } from '../middleware/auth.js';

// Admin login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required',
      });
    }

    // Find admin user
    const result = await query(
      'SELECT id, email, password_hash, full_name, last_login FROM admin_user WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    const admin = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = generateAccessToken({
      id: admin.id,
      email: admin.email,
    });

    // Update last login timestamp
    await query(
      'UPDATE admin_user SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    // Return user info and token
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        last_login: admin.last_login,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during login',
    });
  }
};

// Logout (client-side token removal, optional server-side blacklist)
export const logout = async (req, res) => {
  // In a simple JWT implementation, logout is handled client-side by removing the token
  // For more security, implement a token blacklist here
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

// Verify token
export const verifyToken = async (req, res) => {
  try {
    // If we reached here, the token is valid (middleware verified it)
    const userId = req.user.id;

    // Fetch latest user data
    const result = await query(
      'SELECT id, email, full_name, last_login FROM admin_user WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Admin user does not exist',
      });
    }

    res.json({
      success: true,
      valid: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during token verification',
    });
  }
};

// Get admin profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT id, email, full_name, created_at, last_login FROM admin_user WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Admin user does not exist',
      });
    }

    res.json({
      success: true,
      profile: result.rows[0],
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching profile',
    });
  }
};

// Update admin profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email } = req.body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount}`);
      values.push(full_name);
      paramCount++;
    }

    if (email !== undefined) {
      // Check if email is already taken by another user
      const emailCheck = await query(
        'SELECT id FROM admin_user WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'Email already exists',
          message: 'This email is already in use',
        });
      }

      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE admin_user
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, updated_at
    `;

    const result = await query(updateQuery, values);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while updating profile',
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // Validation
    if (!current_password || !new_password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Current password and new password are required',
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'New password must be at least 6 characters long',
      });
    }

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM admin_user WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Admin user does not exist',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      current_password,
      userResult.rows[0].password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await query(
      'UPDATE admin_user SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while changing password',
    });
  }
};
