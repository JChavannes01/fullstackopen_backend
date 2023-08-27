require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const Person = require("./models/person");

const app = express();

// ==============================
//  MIDDLEWARE
// ==============================
app.use(cors());
app.use(express.static("dist"));
app.use(express.json());

morgan.token("body", (req, res) => JSON.stringify(req.body));
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);

// ==============================
// ENDPOINTS
// ==============================

app.get("/", (request, response) => {
  response.send("<h1>Hello world!</h1>");
});

app.get("/info", (request, response) => {
  Person.find({})
    .then((persons) => {
      const lines = [
        `<p>Phonebook has info for ${persons.length} people</p>`,
        `<p>${new Date()}</p>`,
      ];
      response.send(lines.join("\n"));
    })
    .catch((error) => next(error));
});

app.get("/api/persons", (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons);
  });
});

app.get("/api/persons/:id", (request, response) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error))
    .catch((error) => {
      console.log(error);
    });
});

app.delete("/api/persons/:id", (request, response) => {
  Person.findByIdAndRemove(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.post("/api/persons", (request, response, next) => {
  const { name, number } = request.body;

  const person = new Person({ name, number });
  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson);
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const { name, number } = request.body;

  // option new:true causes the updatedPerson object to contain modified values instead of old values.
  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidations: true, context: "query" }
  )
    .then((updatedPerson) => {
      if (updatedPerson) {
        response.json(updatedPerson);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

// ==============================
// Error handlers
// ==============================

// This should be the final "normal" (i.e. not error handler) route/middleware added to express
const unknownEndpointHandler = (request, response, next) => {
  response.status(404).send({ error: "unknown endpoint" });
};
app.use(unknownEndpointHandler);

// First error handler (extra param for error). Should be added AFTER all middlewares/routes
const errorHandler = (error, request, response, next) => {
  console.error(error.message);
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).send({ error: error.message });
  }

  next(error);
};
app.use(errorHandler);

// ==============================
// Application start
// ==============================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
