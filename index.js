const express = require("express");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 3001;
// console.log(process.env.NODE_ENV === "production");
// console.log(process.env.NODE_ENV);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const auth = require("./util/auth");
const {
	getAllTodos,
	getOneTodo,
	postOneTodo,
	deleteTodo,
	editTodo,
} = require("./api/todo");

const {
	loginUser,
	signUpUser,
	uploadProfilePhoto,
	getUserDetail,
	updateUserDetails,
} = require("./api/users");

app.get("/todos", auth, getAllTodos);
app.get("/todo/:todoId", auth, getOneTodo);
app.post("/todo", auth, postOneTodo);
app.delete("/todo/:todoId", auth, deleteTodo);
app.put("/todo/:todoId", auth, editTodo);

app.post("/login", loginUser);
app.post("/signup", signUpUser);
app.post("/user/image", auth, uploadProfilePhoto);
app.get("/user", auth, getUserDetail);
app.post("/user", auth, updateUserDetails);

app.listen(PORT, () => {
	console.log(`Server listing on ${PORT}`);
});
