const { Server } = require("socket.io");
const {config} = require('../config/secret')


exports.createSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: config.LINK_CLIENT,
            methods: ["GET", "POST"]
        }
    })

    io.on("connection", (socket) => {
       
        socket.on("join_room", (data) => {
            socket.join(data);
        })

        socket.on("send_message", (data) => {
            socket.to(data.room).emit("receive_message", data)
        })

        socket.on("disconnect", () => {
        })
    })
}