const admin = require("firebase-admin");

const serviceAccount =
	process.env.NODE_ENV === "production"
		? JSON.parse(process.env.SERVICE_KEY)
		: require("../serviceKey.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };
