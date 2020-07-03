const { admin, db } = require("../util/admin");

const config =
	process.env.NODE_ENV === "production"
		? require("../util/config")
		: require("../util/config.bak");

const firebase = require("firebase");
firebase.initializeApp(config);

const { validateLoginData, validateSignUpData } = require("../util/validators");

exports.loginUser = (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password,
	};

	const { valid, errors } = validateLoginData(user);
	if (!valid) return res.status(400).json(errors);

	firebase
		.auth()
		.signInWithEmailAndPassword(user.email, user.password)
		.then((data) => data.user.getIdToken())
		.then((token) => res.json({ token }))
		.catch((err) => {
			console.error(err);
			return res
				.status(403)
				.json({ general: "wrong credentials, please try again !" });
		});
};

exports.signUpUser = (req, res) => {
	const newUser = {
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		username: req.body.username,
	};
	const { valid, errors } = validateSignUpData(newUser);

	if (!valid) return res.status(400).json(errors);

	let token, userId;

	db.doc(`/users/${newUser.username}`)
		.get()
		.then((doc) => {
			if (doc.exists)
				return res
					.status(400)
					.json({ username: "This username is already taken" });
			else
				return firebase
					.auth()
					.createUserWithEmailAndPassword(newUser.email, newUser.password);
		})
		.then((data) => {
			userId = data.user.uid;
			return data.user.getIdToken();
		})
		.then((idToken) => {
			token = idToken;
			const userCredentials = {
				firstName: newUser.firstName,
				lastName: newUser.lastName,
				username: newUser.username,
				email: newUser.email,
				createdAt: new Date().toISOString(),
				userId,
			};

			return db.doc(`/user/${newUser.username}`).set(userCredentials);
		})
		.then(() => res.status(201).json({ token }))
		.catch((err) => {
			console.error(err);
			if (err.code === "auth/email-already-in-use")
				return res.status(400).json({ email: "Email already in use" });
			else
				return res
					.status(500)
					.json({ general: "Something went wrong, please try again" });
		});
};

deleteImage = (imageName) => {
	const bucket = admin.storage().bucket();
	const path = `${imageName}`;
	return bucket
		.file(path)
		.delete.then(() => {
			return;
		})
		.catch((err) => {
			return;
		});
};

exports.uploadProfilePhoto = (req, res) => {
	const BusBoy = require("busboy");
	const path = require("path");
	const os = require("os");
	const fs = require("fs");
	const busboy = new BusBoy({ headers: req.headers });

	let imageFileName;
	let imageToBeUploaded = {};

	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		if (mimetype !== "image/png" && mimetype !== "image/jpeg")
			return res.status(400).json({ error: "Wrong file type submitted" });

		const imageExtension =
			filename.split(".")[filename.split(".").length - 1];
		imageFileName = `${req.user.username}.${imageExtension}`;
		const filePath = path.join(os.tmpdir(), imageFileName);
		imageToBeUploaded = { filePath, mimetype };
		file.pipe(fs.createWriteStream(filePath));
	});
	deleteImage(imageFileName);
	busboy.on("finish", () => {
		admin
			.storage()
			.bucket()
			.upload(imageToBeUploaded.filePath, {
				resumable: false,
				metadata: { metadata: { contentType: imageToBeUploaded.mimetype } },
			})
			.then(() => {
				const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
				return db.doc(`/users/${req.user.username}`).update({ imageUrl });
			})
			.then(() => {
				return res.json({ message: "Image uploaded successfully" });
			})
			.catch((err) => {
				console.error(err);
				return res.status(500).json({ error: error.code });
			});
	});
	busboy.end(req.rawBody);
};

exports.getUserDetail = (req, res) => {
	let userData = {};
	db.doc(`/users/${req.user.username}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				userData.userCredentials = doc.data();
				return res.json(userData);
			}
		})
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: error.code });
		});
};

exports.updateUserDetails = (req, res) => {
	let document = db.collection("users").doc(`${req.user.username}`);
	document
		.update(req.body)
		.then(() => {
			res.json({ message: "Updated sucessfully." });
		})
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ message: "Cannot update the value" });
		});
};
