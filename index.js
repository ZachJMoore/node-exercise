const express = require("express");
const app = express();
const port = 3002;
const fetch = require("node-fetch");
const _ = require("lodash");

const getAllPagesData = (endpoint = "people") => {
  return fetch(`http://swapi.dev/api/${endpoint}`)
    .then((res) => res.json())
    .then((data) => {
      const totalPages = Math.ceil(data.count / data.results.length || 10);

      const urls = [];
      for (let i = 1; i <= totalPages; i++) {
        urls.push(`http://swapi.dev/api/${endpoint}/?page=${i}`);
      }
      const dataFetchArray = urls.map((url, index) => {
        return fetch(url)
          .then((res) => res.json())
          .then((data) => Promise.resolve(data.results));
      });

      return Promise.all([Promise.resolve(data.results), ...dataFetchArray]);
    })
    .then((data) => {
      let list = _.flatten(data);
      return Promise.resolve(list);
    });
};

app.get("/people", async (req, res) => {
  getAllPagesData("people")
    .then((list) => {
      if (req.query.sortBy) {
        switch (req.query.sortBy) {
          case "name":
            list = _.sortBy(list, ["name"]);
            break;
          case "height":
            list = _.sortBy(list, ["height"]);
            break;
          case "mass":
            list = _.sortBy(list, ["mass"]);
            break;
          default:
            break;
        }
      }
      res.json(list);
    })
    .catch((error) => {
      console.log(error);
      res.json({ success: false, error: JSON.stringify(error) });
    });
});
app.get("/planets", async (req, res) => {
  getAllPagesData("planets")
    .then((list) => {
      const urls = _.flatten(list.map((planet) => planet.residents));
      const dataFetchArray = urls.map((url, index) => {
        return fetch(url)
          .then((res) => res.json())
          .then((data) => Promise.resolve(data));
      });

      Promise.all(dataFetchArray)
        .then((residents) => {
          list = list.map((planet) => {
            planet.residents = [];

            // Join by url comparison
            residents.forEach((resident) => {
              if (resident.homeworld === planet.url) {
                planet.residents.push(resident.name);
              }
            });
            return planet;
          });
          res.json(list);
        })
        .catch((error) => {
          console.log(error);
          res.json({ success: false, error: JSON.stringify(error) });
        });
    })
    .catch((error) => {
      console.log(error);
      res.json({ success: false, error: JSON.stringify(error) });
    });
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
