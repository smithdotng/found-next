// Ported unchanged from the Express app so both apps share one MongoDB schema.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ['realtor', 'agent', 'admin', 'host'],
        default: 'realtor'
    },
    profileImage: {
        type: String,
        default: 'default-avatar.jpg'
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    newsletter: {
        type: Boolean,
        default: false
    },
    // Realtor specific fields
    realtorProfile: {
        company: String,
        rcNumber: String,
        address: String,
        verified: {
            type: Boolean,
            default: false
        },
        // Annual realtor verification expiry (Next.js app). Empty = verified before plans existed.
        verifiedUntil: Date
    },
    // Found Apartments host (shortlet owner/operator). Added by the Next.js app.
    hostProfile: {
        businessName: String,
        address: String,
        city: String,
        state: String,
        units: Number,
        experience: String,
        idType: String,
        about: String,
        // Vetting by the Found team
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        reviewNote: String,
        reviewedAt: Date,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // Found's share of each booking, agreed in the listing agreement
        commissionRate: { type: Number, default: 25 },
        agreement: {
            status: { type: String, enum: ['none', 'sent', 'accepted'], default: 'none' },
            version: String,
            commissionRate: Number,
            sentAt: Date,
            acceptedAt: Date,
            signedName: String,
            signedIp: String,
            signedUserAgent: String
        },
        bankDetails: {
            bankName: String,
            accountNumber: String,
            accountName: String
        }
    },
    // Agent specific fields
    agentProfile: {
        isApproved: {
            type: Boolean,
            default: false
        },
        registrationPaid: {
            type: Boolean,
            default: false
        },
        paymentReference: String,
        registrationDate: Date,
        uniqueLink: {
            type: String,
            unique: true,
            sparse: true
        },
        socialHandle: String,
        experience: String,
        commission: {
            type: Number,
            default: 70 // 70% commission
        },
        totalEarnings: {
            type: Number,
            default: 0
        },
        pendingWithdrawal: {
            type: Number,
            default: 0
        },
        bankDetails: {
            bankName: String,
            accountNumber: String,
            accountName: String
        }
    },
    // Referral statistics
    referralStats: {
        totalClicks: {
            type: Number,
            default: 0
        },
        totalTransactions: {
            type: Number,
            default: 0
        }
    },
    // User preferences
    preferences: {
        emailInquiries: {
            type: Boolean,
            default: true
        },
        emailTransactions: {
            type: Boolean,
            default: true
        },
        weeklyNewsletter: {
            type: Boolean,
            default: false
        },
        marketingEmails: {
            type: Boolean,
            default: false
        }
    },
    // Password reset (the old controller set these but the schema dropped them,
    // so reset links never worked; declared here so they persist)
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate unique referral link for agents
userSchema.methods.generateUniqueLink = function() {
    const uniqueId = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
    this.agentProfile.uniqueLink = uniqueId;
    return uniqueId;
};

export default mongoose.models.User || mongoose.model('User', userSchema);