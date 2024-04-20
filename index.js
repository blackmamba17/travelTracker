import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Angale1971",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function loadUsers(){
  const result = await db.query(`
  select * from users
  `);
  let users = [];
  result.rows.forEach(user => {
    users.push(user);
  });
  
  return users;
}

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id = " + currentUserId);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });   
  return countries;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const users = await loadUsers();
  
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: users[users.findIndex(obj => obj.id == currentUserId)].color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      const countries = await checkVisisted();
      const users = await loadUsers();
      res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: users[users.findIndex(obj => obj.id == currentUserId)].color,
      error: "country already visited"
    });
    }
  } catch (err) {
    //console.log(err);
    const countries = await checkVisisted();
    const users = await loadUsers();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: users[users.findIndex(obj => obj.id == currentUserId)].color,
      error: "country not exists"
    });
  }
});

app.post("/user", async (req, res) => {
  //get the user id and pass through pages the user id
  console.log(req.body);

  if(req.body.add){
    res.render("new.ejs");
  }else{
    currentUserId = req.body.user;
    res.redirect("/");
  }
  
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can r1eturn the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  try {
    const result = await db.query(`
    insert into users (name, color)
    values (
      '${req.body.name}', '${req.body.color}'
    )
    
    returning id
    `);

    //console.log(result.rows[0].id);
    currentUserId = result.rows[0].id;
    res.redirect("/");
  } catch (error) {
    res.send(error);
  }

  console.log(req.body);
  
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
