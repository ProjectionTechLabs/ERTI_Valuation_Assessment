import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		userCode: {
			type: String,
			unique: true,
			sparse: true,
			trim: true,
		},

		userId: {
			type: String, // Example: ERTI000001
			unique: true,
			sparse: true,
			trim: true,
		},

		partnerId: {
			type: String,
			default: "ERTI",
			trim: true,
		},

		validUser: {
			type: Boolean,
			default: false,
		},

		fname: {
			type: String,
			required: true,
			trim: true,
		},

		lname: {
			type: String,
			required: true,
			trim: true,
		},

		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},

		contact: {
			type: String,
			required: true,
			trim: true,
		},

		companyName: {
			type: String,
			default: "",
			trim: true,
		},

		approximateTurnover: {
			type: String,
			default: "",
			trim: true,
		},

		teamSize: {
			type: String,
			default: "",
			trim: true,
		},

		companySize: {
			type: String,
			default: "",
			trim: true,
		},

		companyLocation: {
			type: String,
			default: "",
			trim: true,
		},

		companyIndustry: {
			type: String,
			default: "",
			trim: true,
		},

		businessType: {
			type: String,
			default: "",
			trim: true,
		},

		productsServices: {
			type: String,
			default: "",
			trim: true,
		},

		isMobileVerified: {
			type: Boolean,
			default: false,
		},

		lastLoginAt: {
			type: Date,
			default: null,
		},

		// Attempt tracking
		assessmentAttemptsCount: {
			type: Number,
			default: 0,
			min: 0,
		},

		attemptsRemaining: {
			type: Number,
			default: 2,
			min: 0,
			max: 2,
		},

		firstAttemptDate: {
			type: Date,
			default: null,
		},

		lastAttemptDate: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	},
);

const User = mongoose.model("User", userSchema);

export default User;
