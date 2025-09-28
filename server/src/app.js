const express = require('express')
const routes = require('./routes')

const app = express()

app.use(express.json())   // برای JSON
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

// ثبت روترها
app.use('/api', routes)

module.exports = app
