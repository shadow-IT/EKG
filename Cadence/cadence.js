const express = require('express')
const axios = require('axios')
const app = express()

const port = 3002

app.get('/', function(req, res) {

        res.send('Hello cadence!')
})

app.get('/health' , function(req, res) {
	res.sendStatus(200)
})

/* TODO
 * Retrieve the cadence for each subscriber, and store them locally. (redis? Array?)
 * 
 * Periodically re-retrieve the cadences for each subscriber.
 * 
 * Continually loops calling the commuter for each subsciber at its desired cadence.
 * 
 * Manually request the cadence be refreshed.
 */

/* retrieve the subscriptions and their data. */
// const subs = axios.get('http://subscription:3003/p/cadence')
// TODO remove subs fake data
axios.get('http://subscription:3003/api/subscribers')
.then(res => res.data)
.then(subs => {
	console.log('Retrieved the subs!:',subs)

	// define function for each sub
	// Higher order
	let myFunc = (sub) => {
		
		return async () => {
			console.log('Calling',sub.name,)
			await axios.get('http://commuter:3004/api/'+sub.name)
			.catch(error => {
				console.error('Error occured trying to initiate a commute for sub:',sub,'.', error)
			})
			.then(res => res.data)
			.then(data => console.log('Successful pulse to',sub.name,data))
		}
	}

	// close the subs into the function and return the list of funcs properly scoped
	let subFuncs = subs.map(sub => {
		return {
			func: myFunc(sub),
			name: sub.name,
			cadence: sub.cadence,
		}
	})

	// set the timer for each sub func
	let subTimers = subFuncs.map(function({func, name, cadence}){
		return {
			timer: setInterval(func, cadence),
			name: name
		}
	});
})

app.listen(port, () => console.log(`Cadence listening on port ${port}!`))
