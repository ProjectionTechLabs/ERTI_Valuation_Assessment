import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
	{
		mobile: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},

		otp: {
			type: String,
			required: true,
			trim: true,
		},

		purpose: {
			type: String,
			enum: ["login", "register"],
			required: true,
		},

		isUsed: {
			type: Boolean,
			default: false,
		},

		expiresAt: {
			type: Date,
			required: true,
			index: { expires: 0 },
		},
	},
	{
		timestamps: true,
	},
);

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
