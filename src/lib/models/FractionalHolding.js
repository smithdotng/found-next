// An investor's units in one offering (their shares in its SPV). One row per investor per offering.
import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema({
    offering: { type: mongoose.Schema.Types.ObjectId, ref: 'FractionalOffering', required: true },
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    units: { type: Number, default: 0, min: 0 },
    unitsListed: { type: Number, default: 0, min: 0 }, // on the resale market, not yet sold
    costBasis: { type: Number, default: 0 },           // total paid for the units still held
    distributionsReceived: { type: Number, default: 0 },
    firstAcquiredAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

holdingSchema.index({ offering: 1, investor: 1 }, { unique: true });
holdingSchema.index({ investor: 1 });

holdingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.FractionalHolding || mongoose.model('FractionalHolding', holdingSchema);
