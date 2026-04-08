import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
	{
		answerId: {
			type: String,
			required: true,
			trim: true,
		},

		questionId: {
			type: String,
			required: true,
			trim: true,
		},

		answerTitle: {
			type: String,
			required: true,
			trim: true,
		},

		answerScore: {
			type: Number,
			required: true,
			default: 0,
		},
	},
	{ _id: false },
);

const questionSchema = new mongoose.Schema(
	{
		questionId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},

		quesTitle: {
			type: String,
			required: true,
			trim: true,
		},

		answers: {
			type: [answerSchema],
			default: [],
		},

		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	},
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
