var models = require('../models/models.js');

// Autoload: id
exports.load = function(req, res, next, quizId) {
    models.Quiz.find({
            where: {
                id : Number(quizId)
            },
            include: [{
                model: models.Comment
            }]
    }).then(function(quiz) {
    	if (quiz) {
        	req.quiz = quiz;
        	next();
      	} 
      	else { 
      		next(new Error('No existe quizId=' + quizId)); 
      	}
    }
    ).catch(function(error) { next(error) });
};

// GET /quizes
exports.index = function(req, res) {
	if ( req.query.hasOwnProperty('search') ) {
		var str = req.query.search;
		var search = "%" + str.replace(" ","%") + "%";
   		models.Quiz.findAll({where: ["pregunta like ?", search]}).then(
   		function(quizes) {
            res.render('quizes/index.ejs', { quizes: quizes, errors: []});
   		}
        ).catch(function(error) {next(error)});
	}
	else {
		models.Quiz.findAll().then(
		function(quizes) {
            res.render('quizes/index.ejs', { quizes: quizes, errors: []});
		}
        ).catch(function(error) {next(error)});
	}
};

// GET /quizes/:id
exports.show = function(req, res) {
    res.render('quizes/show', { quiz: req.quiz, errors: []});
}; // req.quiz: instancia de quiz cargada con autoload

// GET /quizes/:id/answer
 exports.answer = function(req, res) {
 	var resultado = 'Incorrecto';
	if (req.query.respuesta === req.quiz.respuesta) {
	   	resultado = 'Correcto';
	}
    res.render('quizes/answer', {quiz: req.quiz, respuesta: resultado, errors: []});
 };

// GET /quizes/new
exports.new = function(req, res) {
  var quiz = models.Quiz.build(
    {pregunta: "Pregunta", respuesta: "Respuesta"}
  );

  res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res) {
    var quiz = models.Quiz.build( req.body.quiz );

    quiz
    .validate()
    .then(
      function(err){
        if (err) {
          res.render('quizes/new', {quiz: quiz, errors: err.errors});
        } else {
          quiz // save: guarda en DB campos pregunta, respuesta, y tema de quiz
          .save({fields: ["pregunta", "respuesta", "tema"]})
          .then( function(){ res.redirect('/quizes')})
        }      // res.redirect: Redirección HTTP a lista de preguntas
      }
    ).catch(function(error){next(error)});
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
  var quiz = req.quiz;  // req.quiz: autoload de instancia de quiz

  res.render('quizes/edit', {quiz: quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
  req.quiz.pregunta  = req.body.quiz.pregunta;
  req.quiz.respuesta = req.body.quiz.respuesta;
  req.quiz.tema      = req.body.quiz.tema;

  req.quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
      } else {
        req.quiz     // save: guarda campos pregunta y respuesta en DB
        .save( {fields: ["pregunta", "respuesta", "tema"]})
        .then( function(){ res.redirect('/quizes');});
      }     // Redirección HTTP a lista de preguntas (URL relativo)
    }
  ).catch(function(error){next(error)});
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
  req.quiz.destroy().then( function() {
    res.redirect('/quizes');
  }).catch(function(error){next(error)});
};

// GET /author
exports.author = function(req, res) {
    res.render('author', {authorname: 'Scooby Doo', errors: []});
}

// GET /session_expired
exports.session_expired = function(req, res) {
    res.render('session_expired', {errors: []});
}

// GET /quizes/statistics
exports.statistics = function(req, res, next) {
    var stats = {
        questions : 0,
        comments : 0,
        commentsforquestion : 0,
        questionswithoutcomments : 0,
        questionswithcomments : 0,
    };

    models.Quiz.count()
    .then(function (questions) {
        stats.questions = questions;
        return models.Comment.count();
    }).then(function (comments) {
        stats.comments = comments;
        return models.Quiz.findAndCountAll({
                    include: [
                        {
                            model: models.Comment,
                            required: true,
                            where: {
                                publicado: true
                            }
                        }
                    ],
                    distinct: true
                });
    }).then(function (questionswithComments) {
        stats.questionswithcomments = questionswithComments.count;
        stats.questionswithoutcomments = stats.questions - stats.questionswithcomments;
        stats.commentsforquestion = (stats.questions ? (stats.comments/stats.questions).toFixed(2) : 0);
        res.render('quizes/statistics', {stats: stats, errors: []});
    }).catch(function(error){next(error)});
}
