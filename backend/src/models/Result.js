const mongoose = require("mongoose");

const pillarScoreSchema = new mongoose.Schema({
	pillarId: String,

	pillarName: String,

	score: Number,

	meaning: String,
});

const qnaAnalysisSchema = new mongoose.Schema({
	questionId: String,

	answerId: String,

	explanation: String,
});

const resultSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},

	englishCategory: String,

	chanakyaCategory: String,

	modernInterpretation: String,

	finalScore: Number,

	pillarScores: [pillarScoreSchema],

	strengths: [String],

	weaknesses: [String],

	valueEnhancementAnalysis: [qnaAnalysisSchema],

	pillarSummary: String,

	recommendedNextSteps: String,
});

module.exports = mongoose.model("Result", resultSchema);
