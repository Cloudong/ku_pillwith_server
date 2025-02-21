require("dotenv").config();
const express = require("express");
const path = require("path");

// 사용자 로그인 정보 저장
const session = require("express-session");
const sequelize = require("./db");
const SequelizeStore = require("connect-session-sequelize")(session.Store);

// routes
const authRoutes = require("./routes/authRoutes");
const scheRoutes = require("./routes/scheRoutes");
const pillRoutes = require("./routes/pillRoutes");

// swagger
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerOption = require("./swagger");

// scheduler
const { startCronJob, manualFetch, backupDataAWS } = require("./scheduler");

const app = express();

// body-parser 설정
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//session store
const store = new SequelizeStore({
  db: sequelize,
});

// 미들웨어 설정
app.use(express.static(path.join(__dirname, "build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build/index.html"));
});

app.use(
  session({
    secret: "@chars0624",
    store: store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 3600000,
    },
  })
);

store.sync();

//client : CORS 설정
const cors = require("cors");

// CORS 설정
app.use(
  cors({
    origin: ["http://localhost:3000", "http://3.39.227.185:3001"], // 클라이언트의 URL
    credentials: true,
  })
);
app.options("*", cors());

// Swagger 설정
const specs = swaggerJSDoc(swaggerOption);
app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(specs));

// 라우트 설정
app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheRoutes);
app.use("/api/pills", pillRoutes);

// 스케줄러 시작
startCronJob();
manualFetch();

//s3 백업
backupDataAWS();

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
