// Ported unchanged from the Express app so both apps share one MongoDB schema.
import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    propertyTitle: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    // Property owner (realtor) information
    realtor: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        email: String,
        phone: String,
        company: String
    },
    // Agent information (if inquiry came through agent's referral link)
    agent: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        email: String,
        phone: String,
        referralCode: String
    },
    read: {
        type: Boolean,
        default: false
    },
    replied: {
        type: Boolean,
        default: false
    },
    replyMessage: String,
    repliedAt: Date,
    repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);