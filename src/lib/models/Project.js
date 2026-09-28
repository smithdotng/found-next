// Ported unchanged from the Express app so both apps share one MongoDB schema.
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    developer: {
        name: {
            type: String,
            required: true
        },
        website: String,
        contactEmail: String,
        contactPhone: String
    },
    location: {
        address: String,
        city: String,
        state: String,
        lga: String,
        coordinates: {
            lat: Number,
            lng: Number
        },
        googleEarthUrl: String // Link to Google Earth view
    },
    description: {
        short: {
            type: String,
            required: true,
            maxlength: 300
        },
        long: {
            type: String,
            required: true
        }
    },
    features: [{
        icon: String,
        title: String,
        description: String
    }],
    amenities: [String],
    specifications: {
        totalUnits: Number,
        // "type" must be wrapped, otherwise Mongoose reads it as the array's type
        // and unit rows can only be stored as plain strings (bug in the original schema).
        unitSizes: [{
            type: { type: String },
            size: String,
            price: Number,
            available: Number
        }],
        landArea: String,
        completionDate: Date,
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'sold_out'],
            default: 'upcoming'
        }
    },
    media: {
        featuredImage: {
            type: String,
            required: true
        },
        gallery: [{
            url: String,
            caption: String
        }],
        virtualTour: String,
        brochure: String,
        videoTour: String
    },
    pricing: {
        startingPrice: Number,
        priceRange: {
            min: Number,
            max: Number
        },
        paymentPlan: [{
            title: String,
            description: String,
            percentage: Number
        }],
        includes: [String],
        excludes: [String]
    },
    investment: {
        roi: String,
        rentalYield: String,
        capitalAppreciation: String,
        highlights: [String]
    },
    seo: {
        metaTitle: String,
        metaDescription: String,
        metaKeywords: String
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    featured: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate slug from name
projectSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '-');
    }
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.Project || mongoose.model('Project', projectSchema);