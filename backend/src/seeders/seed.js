'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { connectDB } = require('../core/database/connection');
const { RoleModel } = require('../models/Role.model');
const { UserModel } = require('../models/User.model');
const { SettingsModel } = require('../models/Settings.model');
const { PublicSiteModel } = require('../models/PublicSite.model');
const { ROLE_DEFAULTS } = require('../config/permissions');
const mongoose = require('mongoose');

const seed = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    console.log('🌱 Starting database seeding...');

    // 2. Seed / Synchronize Roles
    console.log('Creating/updating system roles...');
    const rolesMap = {};
    for (const [roleName, permissions] of Object.entries(ROLE_DEFAULTS)) {
      // Find or create role
      let role = await RoleModel.findOne({ name: roleName });
      if (!role) {
        role = new RoleModel({
          name: roleName,
          permissions,
          isDefault: true,
          isEditable: roleName !== 'Super Admin',
          description: `Default system role for ${roleName}`
        });
      } else {
        // Update permissions for seeded defaults
        role.permissions = permissions;
        role.isDefault = true;
      }
      await role.save();
      rolesMap[roleName] = role;
      console.log(`✅ Role: "${roleName}" synced with ${permissions.length} permissions.`);
    }

    // 3. Seed initial Super Admin User
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@devbricks.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.SEED_ADMIN_NAME || 'Super Admin';

    let adminUser = await UserModel.findOne({ email: adminEmail });
    if (!adminUser) {
      console.log(`Creating default Super Admin user: ${adminEmail}`);
      adminUser = await UserModel.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: rolesMap['Super Admin']._id,
        phone: '9999999999',
        isActive: true,
        theme: 'dark',
        publicSlug: 'super-admin'
      });
      console.log('✅ Super Admin user seeded successfully.');
    } else {
      // Ensure it has Super Admin role
      adminUser.role = rolesMap['Super Admin']._id;
      await adminUser.save();
      console.log('✅ Checked and ensured admin user has Super Admin role.');
    }

    // 4. Seed Settings Singleton
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create({
        companyName: 'DEV Fly Ash Bricks',
        companyAddress: 'Village Kalan, District Dev, India',
        companyPhone: '9876543210',
        gstNumber: 'GST24DEVBRICKS123',
        bankDetails: {
          bankName: 'State Bank of India',
          accountNumber: '12345678901',
          ifsc: 'SBIN0001234',
          branch: 'Main Town Branch'
        }
      });
      console.log('✅ Seeded default company settings.');
    }

    // 5. Seed Public Site content
    let publicSite = await PublicSiteModel.findOne();
    if (!publicSite) {
      publicSite = await PublicSiteModel.create({
        heroTitle: 'DEV Fly Ash Bricks',
        heroSubtitle: 'Sustainable, high-strength bricks for durable constructions.',
        aboutText: 'Established in the heart of our village, DEV Bricks manufactures top-quality fly ash bricks using state-of-the-art compression molding, ensuring ultimate load bearing capability and standard sizes.',
        products: [
          { name: 'Standard Fly Ash Brick (Class A)', desc: 'Bricks molded with 50%+ fly ash, ideal for structural load bearing walls.', price: '₹6.50 per brick' },
          { name: 'Eco Lite Brick (Class B)', desc: 'Highly insulating eco-bricks for partition walls and light load designs.', price: '₹5.50 per brick' }
        ],
        contactEmail: 'contact@devbricks.com',
        contactPhone: '9876543210',
        contactAddress: 'DEV Bricks Yard, Sector 4, Rural Dev Village',
        socialLinks: {
          facebook: 'https://facebook.com/devbricks',
          instagram: 'https://instagram.com/devbricks',
          whatsapp: 'https://wa.me/919876543210'
        },
        isPublished: true
      });
      console.log('✅ Seeded default public site content.');
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  }
};

seed();
