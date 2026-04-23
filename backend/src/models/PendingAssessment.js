import mongoose from "mongoose";

const pendingAnswerSchema = new mongoose.Schema(
	{
		questionId: {
			type: String,
			trim: true,
		},

		answerId: {
			type: String,
			trim: true,
		},

		answerTitle: {
			type: String,
			trim: true,
		},

		answerScore: {
			type: Number,
			default: 0,
		},
	},
	{ _id: false },
);

const pendingAssessmentSchema = new mongoose.Schema(
	{
		sessionId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
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
			index: true,
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

		answers: {
			type: [pendingAnswerSchema],
			default: [],
		},

		totalScore: {
			type: Number,
			default: 0,
		},

		isOtpVerified: {
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

const pendingAssessment = mongoose.model(
	"PendingAssessment",
	pendingAssessmentSchema,
);

export default pendingAssessment;
