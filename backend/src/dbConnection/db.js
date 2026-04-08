import mongoose from "mongoose";

const dbConnection = async () => {
	try {
		let connect = await mongoose.connect(process.env.MONGO_URL);
		console.log("connect of db done", connect.connection.host);
	} catch (error) {
		process.exit(1);
		console.log(error);
	}
};

export default dbConnection;
