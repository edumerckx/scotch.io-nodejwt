// server.js
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');
var port = process.env.PORT || 3000;

mongoose.connect(config.database);
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));

// rotas
app.get('/', function(req, res) {
	res.send('API em http://localhost:' + port + '/api');
});

// criar um usuario de teste
app.get('/setup', function(req, res) {
	var nick = new User({
		name: 'Nick',
		password: 'nick',
		admin: true
	});

	nick.save(function(err) {
		if (err) {
			throw err;
		}

		console.log('Usuario cadastrado com sucesso');
		res.json({success: true});
	});
});

var router = express.Router();

router.post('/autenticate', function(req, res) {
	User.findOne({
			name: req.body.name
		}, function(err, user) {
			if (err) {
				throw err;
			}	

			if (!user) {
				res.json({success: false, message: 'Falha na autenticacao'});
			} else if (user) {
				if (user.password != req.body.password) {
					res.json({success: false, message: 'Falha na autenticacao'});
				} else {
					var token = jwt.sign(user, app.get('superSecret'), {
						expiresInMinutes: 1
					});

					res.json({success: true, message: 'Seu token', token: token});
				}
			}
		}
	)
});

router.use(function(req, res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	if (token) {
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {
			if (err) {
				return res.json({success: false, message: 'Falha ao autenticar token'});
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else {
		return res.status(403).send({success: false, message: 'Token não informado'});
	}
});

router.get('/', function(req, res) {
	res.json({message: 'Welcome to API'});
});

router.get('/users', function(req, res) {
	User.find({}, function(err, users) {
		res.json(users);
	});
});



app.use('/api', router);


app.listen(port);
console.log('servidor executando na porta ' + port);