import mongoose from "mongoose";

const selectedAnswerSchema = new mongoose.Schema(
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

const assessmentAttemptSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},

		assessmentDate: {
			type: Date,
			default: Date.now,
			index: true,
		},

		totalScore: {
			type: Number,
			default: 0,
		},

		answers: {
			type: [selectedAnswerSchema],
			default: [],
		},
	},
	{
		timestamps: true,
	},
);

const AssessmentAttempt = mongoose.model(
	"AssessmentAttempt",
	assessmentAttemptSchema,
);

export default AssessmentAttempt;
