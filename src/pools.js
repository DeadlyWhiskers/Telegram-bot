const { Pool, Client } = require("pg")
const userPool = new Pool({
    user: process.env.DEFAULT_USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.DEFAULT_PASSWORD,
    port: process.env.PORT
})

const doctorPool = new Pool({
    user: process.env.DOCTOR_USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.DOCTOR_PASSWORD,
    port: process.env.PORT
})

const adminPool = new Pool({
    user: process.env.ADMIN_USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.ADMIN_PASSWORD,
    port: process.env.PORT
})

module.exports = {userPool, doctorPool, adminPool}