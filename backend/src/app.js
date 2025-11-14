const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Routes
const workflowRoutes = require("./routes/workflow.routes");

const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Base route for your app
app.use("/lifecycle/workflows", workflowRoutes);

// Error handler
app.use(errorMiddleware);

module.exports = app;
