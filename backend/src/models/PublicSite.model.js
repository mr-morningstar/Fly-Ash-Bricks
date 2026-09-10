'use strict';

const mongoose = require('mongoose');

const ProductCardSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String },
  desc: { type: String, trim: true },
  price: { type: String, trim: true }
}, { _id: false });

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, default: 'Manufacturing' },
  readTime: { type: String, default: '5 min read' },
  image: { type: String, default: 'assets/gallery-2.jpg' },
  excerpt: { type: String, required: true },
  content: { type: String, default: '' },
  author: { type: String, default: 'Ashish Dansena' },
  date: { type: String, default: 'September 2026' }
}, { timestamps: true });

const GalleryItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, default: 'plant' }, // plant, bricks, delivery, team
  image: { type: String, required: true },
  subtitle: { type: String, default: '' }
}, { timestamps: true });

const PublicSiteSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true, default: 'DEV Fly Ash Bricks' },
    tagline: { type: String, trim: true, default: 'Dev Kumar Dansena' },
    heroTitle: { type: String, trim: true, default: 'Building India’s Future with Fly Ash Bricks' },
    heroSubtitle: { type: String, trim: true, default: 'Premium eco-friendly fly ash bricks crafted with precision and passion. Stronger than clay bricks, better for the environment — built for lasting structures.' },
    heroImage: { type: String, default: 'assets/plant-real.jpg' },
    heroBadge: { type: String, default: 'Trusted Manufacturer Since 2020' },
    heroStats: [
      {
        number: { type: String, default: '50000' },
        suffix: { type: String, default: '+' },
        label: { type: String, default: 'Bricks/Day' }
      }
    ],
    leadership: {
      devDansena: {
        name: { type: String, default: 'Dev Kumar Dansena' },
        role: { type: String, default: 'Founder & Owner · BDC' },
        phone: { type: String, default: '8085112711' },
        location: { type: String, default: 'W5JV+P4H, Sondka, Basanpali, Kharsia, Raigarh, CG 496661' },
        photo: { type: String, default: 'assets/dev-dansena.jpg' },
        badge: { type: String, default: 'BDC · ब्लॉक विकास समिति' }
      },
      ashishDansena: {
        name: { type: String, default: 'Ashish Dansena' },
        role: { type: String, default: 'Director & Operations Manager' },
        phone: { type: String, default: '8085112711' },
        location: { type: String, default: 'W5JV+P4H, Sondka, Basanpali, Kharsia, Raigarh, CG 496661' },
        photo: { type: String, default: 'assets/ashish-dansena.jpg' },
        badge: { type: String, default: 'Operations & Management' }
      },
      family: {
        title: { type: String, default: 'The Dansena Family' },
        subtitle: { type: String, default: 'The heart and soul behind DEV Fly Ash Bricks — a family committed to quality, community, and building Chhattisgarh.' },
        photo: { type: String, default: 'assets/family.jpg' },
        ratingText: { type: String, default: '📍 dev fly ash bricks (⭐ 5.0) ↗' },
        ratingLink: { type: String, default: 'https://maps.google.com/?cid=12428886325267991234' }
      }
    },
    aboutSection: {
      tag: { type: String, default: 'Our Story' },
      title: { type: String, default: 'Passion for Quality' },
      p1: { type: String, default: 'Founded by Dev Kumar Dansena, DEV Fly Ash Bricks began with a simple mission: to produce the highest quality fly ash bricks while making construction more sustainable.' },
      p2: { type: String, default: 'Under his leadership, DEV Fly Ash Bricks has grown from a small unit to a large-scale manufacturing operation serving hundreds of projects across Chhattisgarh.' },
      image: { type: String, default: 'assets/plant-real.jpg' }
    },
    aboutText: { type: String, trim: true, default: 'Founded by Dev Kumar Dansena (BDC), DEV Fly Ash Bricks is committed to supreme compressive strength and eco-friendly construction.' },
    products: [ProductCardSchema],
    gallery: [{ type: String }],
    galleryItems: [GalleryItemSchema],
    articles: [ArticleSchema],
    contactEmail: { type: String, trim: true, default: 'info@devbricks.in' },
    contactPhone: { type: String, trim: true, default: '8085112711' },
    contactAddress: { type: String, trim: true, default: 'W5JV+P4H, Sondka, Basanpali, Kharsia, Raigarh, Chhattisgarh 496661, India' },
    ownerEmail: { type: String, trim: true, default: 'ashishdansena636@gmail.com' },
    googleMapsCid: { type: String, trim: true, default: '12428886325267991234' },
    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      youtube: { type: String, trim: true },
      whatsapp: { type: String, trim: true, default: 'https://wa.me/918085112711' }
    },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const PublicSiteModel = mongoose.models.PublicSite || mongoose.model('PublicSite', PublicSiteSchema);

module.exports = { PublicSiteModel };
