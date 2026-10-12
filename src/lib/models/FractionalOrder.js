// A purchase of units, either from the developer (primary) or another investor (resale).
// Units are held for the investor while they pay by bank transfer; Found confirms the payment.
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    reference: { type: String, required: true, unique: true },
    offering: { type: mongoose.Schema.Types.ObjectId, ref: 'FractionalOffering', required: true },
    offeringTitle: String,
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['primary', 'resale'], default: 'primary' },
    resale: { type: mongoose.Schema.Types.ObjectId, ref: 'FractionalResale' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    units: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true },  // units × unitPrice
    fee: { type: Number, default: 0 },         // investor service fee (primary only)
    total: { type: Number, required: true },   // what the investor transfers

    status: {
        type: String,
        enum: ['pending_payment', 'payment_submitted', 'confirmed', 'cancelled', 'expired', 'refunded'],
        default: 'pending_payment'
    },
    expiresAt: Date,
    payment: {
        payerName: String,
        reference: String,
        paidOn: Date,
        proofImage: String,
        submittedAt: Date,
        confirmedAt: Date,
        confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    refund: { amount: Number, reference: String, at: Date, reason: String },
    // Resale: what Found sends the seller once the buyer's payment is confirmed
    sellerPayout: {
        amount: Number,
        fee: Number,
        status: { type: String, enum: ['not_due', 'due', 'paid'], default: 'not_due' },
        paidAt: Date,
        reference: String
    },
    note: String,
    history: [{ status: String, at: { type: Date, default: Date.now }, by: String, note: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

orderSchema.index({ investor: 1, createdAt: -1 });
orderSchema.index({ offering: 1, status: 1 });
orderSchema.index({ status: 1, expiresAt: 1 });

orderSchema.pre('validate', function (next) {
    if (!this.reference) {
        const t = Date.now().toString(36).toUpperCase().slice(-5);
        const r = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.reference = `FF-${t}${r}`;
    }
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.FractionalOrder || mongoose.model('FractionalOrder', orderSchema);
