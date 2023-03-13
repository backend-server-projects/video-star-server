const express = require("express");
const app = express();
const port = process.env.PORT || 10000;
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "UPDATE", "DELETE"],
  },
});

io.on("connection", (socket) => {
  socket.on("send_message", (data) => {
    console.log(data);
    socket.broadcast.emit("receive_message", data);
  });
});



require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server running");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://adminBlog:xODGiM5OrQAxzBbD@cluster0.tgkwl01.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const run = async () => {
  try {
    const videosCollection = client.db("videoStar").collection("videos");
    const likesCollection = client.db("videoStar").collection("likes");
    const commentsCollection = client.db("videoStar").collection("comments");
    const repliesCollection = client.db("videoStar").collection("replies");
    const notifyCollection = client.db("videoStar").collection("notifications");

    app.get("/videos", async (req, res) => {
      const result = await videosCollection.find({}).toArray();
      res.send(result);
    });

    app.get("/videos/:id", async (req, res) => {
      const keyword = req.params.id;
      const filter = { tags: { $elemMatch: { value: keyword } } };
      const result = await videosCollection.find(filter).toArray();
      res.send(result);
    });

    app.post("/video", async (req, res) => {
      const video = req.body;
      const result = await videosCollection.insertOne(video);
      res.send(result);
    });

    app.get("/video/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { id: id };
      const result = await videosCollection.findOne(filter);
      const viewId = result.id;
      const postView = result.view + 1;
      const filters = { id: viewId };
      await videosCollection.updateOne(filters, { $set: { view: postView } });
      res.send(result);
    });

    app.put("/video/:id", async (req, res) => {
      const id = req.params.id;
      const videoData = req.body;
      const filter = { id: id };
      const option = { upsert: true };
      const updateVideo = {
        $set: videoData,
      };
      const result = await videosCollection.updateOne(
        filter,
        updateVideo,
        option
      );
      res.send(result);
    });

    // fine id likes
    app.get("/likes/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { id: id };
      const result = await likesCollection.find(filter).toArray();
      res.send(result);
    });

    // Like
    app.post("/like", async (req, res) => {
      const like = req.body;
      const result = await likesCollection.insertOne(like);
      res.send(result);
    });

    // get like for user
    app.get("/like/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const filter = { id: id, email: email };
      const result = await likesCollection.find(filter).toArray();
      res.send(result);
    });

    // Like
    app.delete("/unlike/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const filter = { id: id, email: email };
      const result = await likesCollection.deleteOne(filter);
      res.send(result);
    });

    // trending
    app.get("/trending", async (req, res) => {
      const filter = { view: -1 };
      const result = await videosCollection.find({}).sort(filter).toArray();
      res.send(result);
    });

    // Comment
    app.post("/comment", async (req, res) => {
      const comment = req.body;
      const result = await commentsCollection.insertOne(comment);
      res.send(result);
    });

    // Comments
    app.get("/comments/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { id: id };
      const result = await commentsCollection.find(filter).toArray();
      res.send(result);
    });

    // reply
    app.post("/reply", async (req, res) => {
      const reply = req.body;
      const result = await repliesCollection.insertOne(reply);
      res.send(result);
    });

    // replies
    app.get("/replies/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { commentId: id };
      const result = await repliesCollection.find(filter).toArray();
      res.send(result);
    });

    // notifications
    app.post("/notification", async (req, res) => {
      const notifyData = req.body;
      const user = notifyData.user;
      const id = notifyData.videoId;
      const filter = {user: user, videoId: id}
      const old = await notifyCollection.findOne(filter);
      if (old) {
        return;
      } else {
        const result = await notifyCollection.insertOne(notifyData);
        res.send(result);
      }
    });

    app.get("/notification", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const result = await notifyCollection.find(filter).toArray();
      res.send(result);
    });
  } finally {
  }
};

run().catch((err) => {
  console.error(err);
});

server.listen(port, () => {
  console.log("server running on:", port);
});
