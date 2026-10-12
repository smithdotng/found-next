// Units an investor has put up for sale on the Found Fractional secondary market.
import mongoose from 'mongoose';

const resaleSchema = new mongoose.Schema({
    offering: { type: mongoose.Schema.Types.ObjectId, ref: 'FractionalOffering', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    units: { type: Number, required: true, min: 1 },  // listed
    unitsReserved: { type: Number, default: 0 },      // in unpaid buyer orders
    unitsSold: { type: Number, default: 0 },
    pricePerUnit: { type: Number, required: true },
    status: { type: String, enum: ['listed', 'sold', 'withdrawn'], default: 'listed' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

resaleSchema.index({ offering: 1, status: 1, pricePerUnit: 1 });
resaleSchema.index({ seller: 1 });

resaleSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.FractionalResale || mongoose.model('FractionalResale', resaleSchema);
