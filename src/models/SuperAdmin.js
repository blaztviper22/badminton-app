const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('config');
const jwt = require('jsonwebtoken');

const superAdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          const validDomains = ['gmail.com', 'yahoo.com', 'googlemail.com'];
          const domain = value.split('@')[1];
          return validDomains.includes(domain);
        },
        message: 'Email must be from Gmail, Yahoo, or Googlemail.'
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(value);
        },
        message: 'Password must be stronger (contain upper/lower case letters, numbers, and special characters).'
      },
      select: false // prevents password from being returned in queries
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['superadmin'],
        message: 'Role must be Superadmin.'
      }
    }
  },
  {
    timestamps: true,
    strict: 'throw'
  }
);

// hash the password before saving
superAdminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// method to compare password
superAdminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// method to generate JWT token
superAdminSchema.methods.generateToken = function (type) {
  const payload = {
    id: this._id,
    role: this.role
  };

  if (type === 'access') {
    // generate an access token (short-lived)
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '1d', algorithm: 'HS256' });
  }

  if (type === 'refresh') {
    // generate a refresh token (long-lived)
    return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '14d', algorithm: 'HS256' });
  }

  throw new Error('Invalid token type');
};

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

module.exports = SuperAdmin;
