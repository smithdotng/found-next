// Found Fractional: one offering per property. Each offering is held by its own SPV
// (a company that owns the property); investors buy units, which are shares in that SPV.
import mongoose from 'mongoose';

const docSchema = new mongoose.Schema({
    key: { type: String, required: true },
    name: String,
    label: String, // e.g. "Information memorandum", "Title document", "Valuation report"
    contentType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
});

const updateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: String,
    progress: Number, // construction progress % at the time of the update
    image: String,
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const offeringSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Optional links to an existing Found listing or project page
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

    summary: { type: String, maxlength: 300 },
    description: String,
    assetType: { type: String, enum: ['residential', 'commercial', 'mixed_use', 'land', 'shortlet'], default: 'residential' },
    // off_plan = funds construction, returns on completion/sale; income = completed, pays rent
    stage: { type: String, enum: ['off_plan', 'income'], default: 'off_plan' },
    returnTypes: [{ type: String, enum: ['capital_growth', 'rental_income'] }],

    location: { address: String, city: String, state: String, lga: String },
    images: [String],
    videoUrl: String,
    documents: [docSchema],

    // The company that holds the property and whose shares investors own
    spv: {
        name: String,
        rcNumber: String,
        trustee: String,      // SEC-registered trustee / custodian
        titleDocument: String // e.g. "C of O", "Governor's consent"
    },
    // Where investors pay. Should be the SPV's escrow/custodial account.
    paymentAccount: { bankName: String, accountName: String, accountNumber: String },

    // Raise
    totalValue: { type: Number, required: true },   // valuation of the asset being offered
    totalUnits: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    minUnits: { type: Number, default: 1 },
    maxUnitsPerInvestor: Number,
    softCapPercent: { type: Number, default: 80 }, // minimum % that must sell for the raise to go ahead
    unitsReserved: { type: Number, default: 0 },   // held by unpaid orders
    unitsSold: { type: Number, default: 0 },       // paid and confirmed
    opensAt: Date,
    closesAt: Date,

    // Projections (developer's targets, reviewed by Found; never guaranteed)
    projections: {
        rentalYield: Number,     // % per year
        appreciation: Number,    // % per year
        holdMonths: Number,
        completionDate: Date,
        payoutFrequency: { type: String, enum: ['monthly', 'quarterly', 'biannual', 'annual', 'on_exit'], default: 'quarterly' },
        exitStrategy: String
    },
    risk: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
    riskNotes: String,

    // Fees (percent)
    fees: {
        platform: { type: Number, default: 5 },    // from the developer, on funds raised
        investor: { type: Number, default: 1 },    // service fee added to each primary purchase
        management: { type: Number, default: 10 }, // of rental income before distribution
        resale: { type: Number, default: 2 }       // from the seller on secondary sales
    },
    resaleEnabled: { type: Boolean, default: true },
    // Latest independent valuation per unit, for portfolio values
    currentUnitValue: Number,
    valuationDate: Date,

    status: {
        type: String,
        enum: ['draft', 'in_review', 'changes_requested', 'live', 'funded', 'active', 'exited', 'cancelled'],
        default: 'draft'
    },
    reviewNote: String,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    goLiveAt: Date,
    fundedAt: Date,
    closedAt: Date,
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },

    updates: [updateSchema],
    history: [{ status: String, at: { type: Date, default: Date.now }, by: String, note: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

offeringSchema.index({ status: 1, featured: -1, createdAt: -1 });
offeringSchema.index({ developer: 1 });

offeringSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.FractionalOffering || mongoose.model('FractionalOffering', offeringSchema);
