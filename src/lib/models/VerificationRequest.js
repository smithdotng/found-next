// Paid verification requests (Next.js app): a realtor pays by bank transfer and submits the
// payment details here; an admin confirms the payment and approves or rejects.
import mongoose from 'mongoose';

const verificationRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['property', 'annual'], required: true },
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    amount: { type: Number, required: true },
    payerName: { type: String, required: true },
    paymentReference: String,
    paidOn: Date,
    proofImage: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

verificationRequestSchema.index({ status: 1, createdAt: -1 });
verificationRequestSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.VerificationRequest || mongoose.model('VerificationRequest', verificationRequestSchema);
