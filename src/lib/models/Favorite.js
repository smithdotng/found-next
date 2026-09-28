// Ported unchanged from the Express app so both apps share one MongoDB schema.
import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only favorite a property once
favoriteSchema.index({ property: 1, user: 1 }, { unique: true });

export default mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);