// A payout to an offering's investors: rental income, or proceeds when the property is sold.
// Split pro rata by units held when it is declared.
import mongoose from 'mongoose';

const lineSchema = new mongoose.Schema({
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    units: Number,
    amount: Number,
    status: { type: String, enum: ['due', 'paid', 'on_hold'], default: 'due' },
    paidAt: Date,
    reference: String
});

const distributionSchema = new mongoose.Schema({
    offering: { type: mongoose.Schema.Types.ObjectId, ref: 'FractionalOffering', required: true },
    kind: { type: String, enum: ['rental', 'exit', 'other'], default: 'rental' },
    period: String,        // e.g. "Q3 2026"
    gross: { type: Number, required: true },
    managementFee: { type: Number, default: 0 },
    net: { type: Number, required: true },
    perUnit: Number,
    unitsAtRecord: Number,
    note: String,
    lines: [lineSchema],
    declaredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    declaredAt: { type: Date, default: Date.now }
});

distributionSchema.index({ offering: 1, declaredAt: -1 });
distributionSchema.index({ 'lines.investor': 1 });

export default mongoose.models.FractionalDistribution || mongoose.model('FractionalDistribution', distributionSchema);
