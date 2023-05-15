import dotenv from 'dotenv'
import express from 'express'
import { filesUri } from './config'
import { homePage, startNgrok, staticFile, zipping } from './controllers'

dotenv.config()

const app = express()

app.set('view engine', 'ejs')

app.get(`/${filesUri}/zip`, zipping)
app.use(`/${filesUri}`, staticFile)
app.get('/', homePage)

const port = +process.env.PORT || 8098
app.listen(port, () => startNgrok(port))
