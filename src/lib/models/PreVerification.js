// Property pre-verification checklist (Next.js app). One per property: the realtor declares
// the title, ownership/authority and any encumbrance, and uploads private copies of the
// documents. Found reviews it before verifying the listing.
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    key: { type: String, required: true },          // private storage key, never a public URL
    name: String,
    contentType: String,
    size: Number,
    kind: { type: String, enum: ['title', 'survey', 'authority', 'other'], default: 'other' },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const preVerificationSchema = new mongoose.Schema({
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    titleType: { type: String, required: true },
    titleTypeOther: String,
    titleNumber: String,
    titleHolder: String,
    ownership: { type: String, enum: ['owner', 'authorised'], required: true },
    encumbered: { type: String, enum: ['no', 'yes', 'unsure'], required: true },
    encumbrances: [String],
    encumbranceDetails: String,
    surveyPlan: { type: String, enum: ['yes', 'no', 'in_progress'] },
    notes: String,
    documents: [documentSchema],
    declaration: { type: Boolean, default: false },
    status: { type: String, enum: ['submitted', 'needs_changes', 'accepted'], default: 'submitted' },
    adminNote: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    submittedAt: Date
}, { timestamps: true });

preVerificationSchema.index({ owner: 1 });
preVerificationSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.models.PreVerification || mongoose.model('PreVerification', preVerificationSchema);
