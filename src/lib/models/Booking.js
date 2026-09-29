// Shortlet bookings for Found Apartments. Extends the Express app's Booking schema
// (same "bookings" collection and field names) with request-to-book fields.
import mongoose from 'mongoose';
import { randomBytes } from 'crypto';

const bookingSchema = new mongoose.Schema({
    bookingReference: { type: String, required: true, unique: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    propertyTitle: String,
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guest: {
        name: { type: String, required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, required: true },
        numberOfGuests: { type: Number, required: true, min: 1 }
    },
    dates: {
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
        nights: { type: Number, required: true }
    },
    pricing: {
        nightlyRate: Number,
        weekendRate: Number,
        subtotal: Number,
        cleaningFee: Number,
        securityDeposit: Number,
        discount: { type: Number, default: 0 },
        discountType: { type: String, enum: ['weekly', 'monthly', 'early_bird', 'last_minute', 'custom', null] },
        // Accommodation before VAT (subtotal + cleaning fee), VAT rate (%) and amount
        net: Number,
        vatRate: Number,
        vat: Number,
        // What the guest pays, VAT included (caution fee excluded)
        total: { type: Number, required: true }
    },
    payment: {
        method: { type: String, enum: ['card', 'bank_transfer', 'cash', 'paystack', 'direct'], default: 'direct' },
        status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
        transactionReference: String,
        paidAt: Date,
        refundReference: String
    },
    // pending = request awaiting the host; confirmed = host accepted (dates held)
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'declined', 'expired', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
        default: 'pending'
    },
    specialRequests: String,
    hostNote: String,
    declineReason: String,
    confirmedAt: Date,
    cancellation: {
        cancelledAt: Date,
        cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        byGuest: Boolean,
        reason: String,
        refundAmount: Number
    },
    // Found's share under the host listing agreement
    commission: {
        rate: Number,
        amount: Number,
        status: { type: String, enum: ['not_due', 'due', 'paid', 'waived'], default: 'not_due' },
        paidAt: Date,
        reference: String
    },
    history: [{
        status: String,
        at: { type: Date, default: Date.now },
        by: String,
        note: String
    }],
    // Lets the guest view their booking without an account
    accessToken: { type: String, default: () => randomBytes(16).toString('hex') },
    review: { rating: Number, comment: String, createdAt: Date },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

bookingSchema.index({ property: 1, 'dates.checkIn': 1, 'dates.checkOut': 1 });
bookingSchema.index({ host: 1, status: 1 });

bookingSchema.pre('validate', function (next) {
    if (!this.bookingReference) {
        const timestamp = Date.now().toString(36).toUpperCase().slice(-5);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.bookingReference = `FA-${timestamp}${random}`;
    }
    this.updatedAt = Date.now();
    next();
});

/** Statuses that hold the dates on the calendar. */
bookingSchema.statics.HOLDING = ['confirmed', 'checked_in'];

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
