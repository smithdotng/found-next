/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Model } from "mongoose";
import UserModel from "./User";
import PropertyModel from "./Property";
import InquiryModel from "./Inquiry";
import ProjectModel from "./Project";
import ProjectInquiryModel from "./ProjectInquiry";
import BlogModel from "./Blog";
import FeaturedPropertyModel from "./FeaturedProperty";
import PromotionModel from "./Promotion";
import ClickModel from "./Click";
import TransactionModel from "./Transaction";
import WithdrawalModel from "./Withdrawal";
import FavoriteModel from "./Favorite";
import NewsletterCampaignModel from "./NewsletterCampaign";

// The schemas live in plain JS (ported verbatim from the Express app);
// these aliases give the TypeScript side a usable Model type.
export const User = UserModel as Model<any>;
export const Property = PropertyModel as Model<any>;
export const Inquiry = InquiryModel as Model<any>;
export const Project = ProjectModel as Model<any>;
export const ProjectInquiry = ProjectInquiryModel as Model<any>;
export const Blog = BlogModel as Model<any>;
export const FeaturedProperty = FeaturedPropertyModel as Model<any>;
export const Promotion = PromotionModel as Model<any>;
export const Click = ClickModel as Model<any>;
export const Transaction = TransactionModel as Model<any>;
export const Withdrawal = WithdrawalModel as Model<any>;
export const Favorite = FavoriteModel as Model<any>;
export const NewsletterCampaign = NewsletterCampaignModel as Model<any>;
