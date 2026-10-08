// Found Prestige private client requests (concierge leads). Added by the Next.js app.
import mongoose from 'mongoose';

const privateClientSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, trim: true },
    interest: String,
    locations: [String],
    budget: String,
    timeline: String,
    payment: String,
    message: String,
    // How they reached us: a partner code from a referral link (e.g. ?partner=bankname), or what they told us
    partner: { type: String, trim: true, lowercase: true },
    referredBy: String,
    // Optional: the Prestige listing they enquired from
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    status: { type: String, enum: ['new', 'contacted', 'qualified', 'closed'], default: 'new' },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

privateClientSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.PrivateClient || mongoose.model('PrivateClient', privateClientSchema);
