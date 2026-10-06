// Ported unchanged from the Express app so both apps share one MongoDB schema.
// Stores newsletter campaigns composed and sent from the admin panel.
import mongoose from 'mongoose';

const newsletterCampaignSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true
    },
    // Rich HTML body (inner content, wrapped in the branded template on send)
    content: {
        type: String,
        required: true
    },
    // Who the campaign targets
    audience: {
        type: String,
        enum: ['realtors', 'agents', 'all', 'realtors_optin', 'agents_optin', 'all_optin'],
        default: 'realtors_optin'
    },
    status: {
        type: String,
        enum: ['draft', 'sending', 'sent', 'failed'],
        default: 'draft'
    },
    recipientCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sentAt: Date,
    // Next.js app: who has been sent this campaign (so an interrupted send can resume without
    // duplicates) and a short lease so only one sender runs at a time.
    sentTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lockedUntil: Date,
    lastProgressAt: Date
}, { timestamps: true });

export default mongoose.models.NewsletterCampaign || mongoose.model('NewsletterCampaign', newsletterCampaignSchema);
