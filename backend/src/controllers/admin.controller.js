import Question from "../models/Question.js";

export const createQuestion = async (req, res) => {
	try {
		const question = await Question.create(req.body);
		res.json(question);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export const getQuestions = async (req, res) => {
	try {
		const questions = await Question.find();
		res.json(questions);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export const updateQuestion = async (req, res) => {
	try {
		const q = await Question.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});
		res.json(q);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export const deleteQuestion = async (req, res) => {
	try {
		await Question.findByIdAndDelete(req.params.id);
		res.json({ message: "Deleted" });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
