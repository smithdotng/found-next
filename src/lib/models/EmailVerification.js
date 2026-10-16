// Short-lived email verification codes (e.g. verifying the email on a Found Prestige enquiry
// before it is sent). One active code per email+purpose; replaced on resend. Added by the Next.js app.
import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

emailVerificationSchema.index({ email: 1, purpose: 1 });
// TTL cleanup of expired codes (supported on MongoDB; harmless if the engine ignores it).
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.EmailVerification || mongoose.model('EmailVerification', emailVerificationSchema);
