import express from "express";
import cors from "cors";
import controller from "./controller"

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

app.use("/", controller);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


export default app;
